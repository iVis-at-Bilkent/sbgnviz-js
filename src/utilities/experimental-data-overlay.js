/*
 * Common utilities for elements includes both general utilities and sbgn specific utilities
 */
var jQuery = $ = libs.jQuery;

module.exports = function () {
    var cy;
    var genomicdDataMap;
    var visibleGenomicDataMapByType;
    var groupedGenomicDataCount;
    var groupedGenomicDataMap;
    var DEFAULT_VISIBLE_GENOMIC_DATA_COUNT = 3;
    var MAX_VISIBLE_GENOMIC_DATA_COUNT = 6;
    var observers;
    function experimentalDataOverlay (param) {
      // Init
      console.log("in init");
      cy = param.sbgnCyInstance.getCy();
      genomicDataMap = {};
      visibleGenomicDataMapByType = {};
      groupedGenomicDataCount = 0;
      groupedGenomicDataMap = {};
      this.observers = [];
    }
    //functionalities for data processing
    experimentalDataOverlay.clearAllGenomicData = function(){
      this.genomicDataMap = {};
      this.visibleGenomicDataMapByType = {};
      this.groupedGenomicDataMap = {};
      this.groupedGenomicDataCount = 0;
    }
    experimentalDataOverlay.getEmptyGroupID = function() {
      const oldCount = this.groupedGenomicDataCount
      this.groupedGenomicDataCount++
      return oldCount
    }
  
    experimentalDataOverlay.addGenomicDataLocally= function(genomicData, groupID) {
      this.parseGenomicData(genomicData, groupID)
      this.showGenomicData()
      this.notifyObservers()
    }
  
    experimentalDataOverlay.preparePortalGenomicDataShareDB = function(genomicData) {
      const geneMap = {}
      const visMap = {}
  
      for (const cancerKey in genomicData) {
        for (const geneSymbol in genomicData[cancerKey]) {
          geneMap[geneSymbol] = {}
          geneMap[geneSymbol][cancerKey] = genomicData[cancerKey][geneSymbol]
        }
  
        visMap[cancerKey] = true
      }
  
      return {
        genomicDataMap: geneMap,
        visibilityMap: visMap
      }
    }
  
    experimentalDataOverlay.addGenomicData= function(data) {
      this.genomicDataMap = data
    }
  
    experimentalDataOverlay.removeGenomicVisData= function() {
      this.visibleGenomicDataMapByType = {}
    }
  
    experimentalDataOverlay.addGenomicDataWithGeneSymbol= function(geneSymbol, data) {
      this.genomicDataMap[geneSymbol] = data
    }
  
    experimentalDataOverlay.addGenomicGroupData= function(groupID, data) {
      this.groupedGenomicDataMap[groupID] = data
    }
  
    experimentalDataOverlay.addPortalGenomicData= function(data, groupID) {
      for (const cancerStudy of Object.keys(data)) {
        this.visibleGenomicDataMapByType[cancerStudy] = true
  
        // Group current cancer study according to the groupID
        if (this.groupedGenomicDataMap[groupID] === undefined) {
          this.groupedGenomicDataMap[groupID] = []
        }
  
        this.groupedGenomicDataMap[groupID].push(cancerStudy)
  
        var cancerData = data[cancerStudy]
  
        for (const geneSymbol of Object.keys(cancerData)) {
          if (this.genomicDataMap[geneSymbol] === undefined)
            this.genomicDataMap[geneSymbol] = {}
  
          this.genomicDataMap[geneSymbol][cancerStudy] = data[cancerStudy][
            geneSymbol
          ].toFixed(2)
        }
      }
  
      this.showGenomicData()
      this.notifyObservers()
    }
    experimentalDataOverlay.removeGenomicData = function() {
      this.genomicDataMap = {}
    }
    experimentalDataOverlay.removeGenomicDataWithGeneSymbol = function(geneSymbol) {
      this.genomicDataMap[geneSymbol] = {}
    }
    experimentalDataOverlay. addGenomicVisData = function(key, data) {
      this.visibleGenomicDataMapByType[key] = data
    }
    experimentalDataOverlay.prepareGenomicDataShareDB = function(genomicData) {
      const genomicDataMap = {}
      const cancerTypes = []
      const visibleGenomicDataMapByType = {}
  
      // By lines
      const lines = genomicData.split('\n')
      // First line is meta data !
      const metaLineColumns = lines[0].split('\t')
  
      // Parse cancer types
      for (let i = 1; i < metaLineColumns.length; i++) {
        cancerTypes.push(metaLineColumns[i])
        // Update initially visible genomic data boxes !
        if (i - 1 < this.DEFAULT_VISIBLE_GENOMIC_DATA_COUNT) {
          visibleGenomicDataMapByType[cancerTypes[i - 1]] = true
        } else {
          visibleGenomicDataMapByType[cancerTypes[i - 1]] = false
        }
      }
  
      // parse genomic data
      for (let i = 1; i < lines.length; i++) {
        // EOF check
        if (lines[i].length === 0) {
          break
        }
  
        // Split each line by tab and parse genomic data content
        const lineContent = lines[i].split('\t')
        const geneSymbol = lineContent[0]
  
        // If current gene entry is not  in genomic data map create new hashmap entry
        if (!(geneSymbol in genomicDataMap)) {
          genomicDataMap[geneSymbol] = {}
        }
  
        // Add each entry of genomic data
        for (let j = 1; j < lineContent.length; j++) {
          genomicDataMap[geneSymbol][cancerTypes[j - 1]] = lineContent[j]
        }
      }
  
      const returnObj = {
        genomicDataMap: genomicDataMap,
        visibilityMap: visibleGenomicDataMapByType
      }
  
      return returnObj
    }
  
    experimentalDataOverlay.updateGenomicDataVisibility = function(_key, isVisible) {
      if (_key in this.visibleGenomicDataMapByType) {
        this.visibleGenomicDataMapByType[_key] = isVisible
      }
    }
  
    experimentalDataOverlay.hideGenomicData = function() {
      this.cy
        .style()
        .selector('node[type="GENE"]')
        .style('text-margin-y', 0)
        .style('width', function(ele) {
          return 150
        })
        .style('background-image', function(ele) {
          const dataURI = 'data:image/svg+xml;utf8,'
          return dataURI
        })
        .update()
    }
  

    experimentalDataOverlay.countVisibleGenomicDataByType = function() {
      // Count the genomic data that will be displayed on nodes' body
      let genomicDataBoxCount = 0
      for (let type in this.visibleGenomicDataMapByType) {
        if (this.visibleGenomicDataMapByType[type]) {
          genomicDataBoxCount++
        }
      }
      return genomicDataBoxCount
    }

    experimentalDataOverlay.getRequiredWidthForGenomicData = function (genomicDataBoxCount) {
      const term = genomicDataBoxCount > 3 ? genomicDataBoxCount - 3 : 0
      return 150 + term * 35
    }
    
    experimentalDataOverlay.generateSVGForNode = function (ele) {
      const genomicDataBoxCount = this.countVisibleGenomicDataByType()
  
      // Experimental data overlay part !
      const dataURI = 'data:image/svg+xml;utf8,'
      const svgNameSpace = 'http://www.w3.org/2000/svg'
      const nodeLabel = ele.data('name')
  
      // If there is no genomic data for this node return !
      if (!(nodeLabel in this.genomicDataMap)) {
        return dataURI
      }
  
      const eleBBox = ele.boundingBox()
      const reqWidth = this.getRequiredWidthForGenomicData(genomicDataBoxCount)
      const overlayRecBoxW = reqWidth - 10
      const overlayRecBoxH = 25
      const svg = document.createElementNS(svgNameSpace, 'svg')
      // It seems this should be set according to the node size !
      svg.setAttribute('width', reqWidth)
      svg.setAttribute('height', eleBBox.h)
      // This is important you need to include this to succesfully render in cytoscape.js!
      svg.setAttribute('xmlns', svgNameSpace)
  
      // Overlay Data Rect
      const overLayRectBBox = {
        w: overlayRecBoxW,
        h: overlayRecBoxH,
        x: reqWidth / 2 - overlayRecBoxW / 2,
        y: eleBBox.h / 2 + overlayRecBoxH / 2 - 18
      }
  
      const genomicFrequencyData = this.genomicDataMap[nodeLabel]
  
      let maxGenomicDataBoxCount = /*(genomicDataBoxCount > 3) ? 3:*/ genomicDataBoxCount
      let genomicBoxCounter = 0
  
      for (let i in this.groupedGenomicDataMap) {
        for (let j in this.groupedGenomicDataMap[i]) {
          const cancerType = this.groupedGenomicDataMap[i][j]
          if (!this.visibleGenomicDataMapByType[cancerType]) {
            continue
          }
  
          if (genomicFrequencyData[cancerType] !== undefined) {
            genomicDataRectangleGenerator(
              overLayRectBBox.x +
                (genomicBoxCounter * overLayRectBBox.w) / maxGenomicDataBoxCount,
              overLayRectBBox.y,
              overLayRectBBox.w / maxGenomicDataBoxCount,
              overLayRectBBox.h,
              genomicFrequencyData[cancerType],
              svg
            )
          } else {
            genomicDataRectangleGenerator(
              overLayRectBBox.x +
                (genomicBoxCounter * overLayRectBBox.w) / maxGenomicDataBoxCount,
              overLayRectBBox.y,
              overLayRectBBox.w / maxGenomicDataBoxCount,
              overLayRectBBox.h,
              null,
              svg
            )
          }
  
          genomicBoxCounter++
        }
      }
  
      function genomicDataRectangleGenerator(x, y, w, h, percent, parentSVG) {
        let colorString = ''
        if (percent) {
          const isNegativePercent = percent < 0
          let _percent = Math.abs(percent)
          // Handle special cases here !
          _percent = _percent < 0.5 ? 2 : _percent
          _percent = _percent === 1 ? 2 : _percent
          // Here we are using non linear regression
          // Fitting points of (0,0), (25,140), (50,220), (100, 255)
          const percentColor = 255 - (-7.118 + 53.9765 * Math.log(_percent))
  
          if (percent === 0) {
            colorString = 'rgb(255,255,255)'
          } else if (isNegativePercent) {
            colorString =
              'rgb(' +
              Math.round(percentColor) +
              ',' +
              Math.round(percentColor) +
              ',255)'
            percent = percent.substring(1)
          } else {
            colorString =
              'rgb(255,' +
              Math.round(percentColor) +
              ',' +
              Math.round(percentColor) +
              ')'
          }
          // Rectangle Part
          const overlayRect = document.createElementNS(svgNameSpace, 'rect')
          overlayRect.setAttribute('x', x)
          overlayRect.setAttribute('y', y)
          overlayRect.setAttribute('width', w)
          overlayRect.setAttribute('height', h)
          overlayRect.setAttribute(
            'style',
            'stroke-width:1;stroke:rgb(0,0,0);opacity:1;fill:' + colorString + ';'
          )
  
          parentSVG.appendChild(overlayRect)
        } else {
          colorString = 'rgb(210,210,210)'
  
          // Rectangle Part
          const overlayRect = document.createElementNS(svgNameSpace, 'rect')
          overlayRect.setAttribute('x', x)
          overlayRect.setAttribute('y', y)
          overlayRect.setAttribute('width', w)
          overlayRect.setAttribute('height', h)
          overlayRect.setAttribute(
            'style',
            'stroke-width:1;stroke:rgb(0,0,0);opacity:1;fill:' + colorString + ';'
          )
  
          parentSVG.appendChild(overlayRect)
        }
      }
  
      return svg
    }

    experimentalDataOverlay.showGenomicData = function() {
      const self = this
  
      const genomicDataBoxCount = this.countVisibleGenomicDataByType()
  
       if (genomicDataBoxCount < 1) {
        // Hide all genomic data and return
        this.hideGenomicData()
        return
       }
  
      console.log('Inside showGenomicData')
      console.log(this.cy)
  
      this.cy
        .style()
        .selector('node[type="GENE"]')
        // It used to change the width of nodes only locally
        .style('width', ele => {
          return this.getRequiredWidthForGenomicData(genomicDataBoxCount)
        })
        .style('text-margin-y', function(ele) {
          const nodeLabel = ele.data('name')
          // If there is no genomic data for this node return !
          if (!(nodeLabel in self.genomicDataMap)) {
            return 0
          }
  
          // Else shift label in Y axis
          return -15
        })
        .style('backgorund-fit', 'contain')
        .style('background-image', function(ele) {
          const x = encodeURIComponent(self.generateSVGForNode(ele).outerHTML)
          if (x === 'undefined') {
            return 'none'
          }
          const dataURI = 'data:image/svg+xml;utf8,' + x
          // console.log(dataURI)
          return dataURI
        })
        .update()
    }

    experimentalDataOverlay.parseGenomicData= function(genomicData, groupID) {
      console.log("parse genomic data");
      this.genomicDataMap = this.genomicDataMap || {}
      this.visibleGenomicDataMapByType = this.visibleGenomicDataMapByType || {}
      this.groupedGenomicDataMap = this.groupedGenomicDataMap || {}
      const cancerTypes = []
  
      // By lines
      const lines = genomicData.split('\n')
      // First line is meta data !
      const metaLineColumns = lines[0].split('\t')
  
      // Parse cancer types
      for (let i = 1; i < metaLineColumns.length; i++) {
        cancerTypes.push(metaLineColumns[i])
        // Update initially visible genomic data boxes !
        if (i - 1 < this.DEFAULT_VISIBLE_GENOMIC_DATA_COUNT) {
          this.visibleGenomicDataMapByType[cancerTypes[i - 1]] = true
        } else {
          this.visibleGenomicDataMapByType[cancerTypes[i - 1]] = false
        }
  
        if (this.groupedGenomicDataMap[groupID] === undefined) {
          this.groupedGenomicDataMap[groupID] = []
        }
        this.groupedGenomicDataMap[groupID].push(cancerTypes[i - 1])
      }
      console.log("first for out");
      // parse genomic data
      for (let i = 1; i < lines.length; i++) {
        // EOF check
        if (lines[i].length === 0) {
          break
        }
  
        // Split each line by tab and parse genomic data content
        const lineContent = lines[i].split('\t')
        const geneSymbol = lineContent[0]
  
        // If current gene entry is not  in genomic data map create new map
        if (!(geneSymbol in this.genomicDataMap)) {
          this.genomicDataMap[geneSymbol] = {}
        }
  
        // Add each entry of genomic data
        for (let j = 1; j < lineContent.length; j++) {
          this.genomicDataMap[geneSymbol][cancerTypes[j - 1]] = lineContent[j]
        }
      }
    }
  
    // Simple observer-observable pattern for views!!!!!
    experimentalDataOverlay.registerObserver = function(observer) {
      this.observers.push(observer)
    }
  
    experimentalDataOverlay.notifyObservers= function() {
      for (const observer of this.observers) {
        observer.notify()
      }
    }

    return experimentalDataOverlay;
}
