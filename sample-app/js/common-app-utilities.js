var commonAppUtilities = commonAppUtilities ? commonAppUtilities : {
  sbgnNetworkContainer: undefined,
  sbgnLayoutProp: undefined,
  sbgnProperties: undefined,
  pathsBetweenQuery: undefined,
  defaultSbgnStyleRules: {
    'compound-padding': 10,
    'dynamic-label-size': 'regular',
    'fit-labels-to-nodes': false,
    'rearrange-after-expand-collapse': true,
    'tiling-padding-vertical': 20,
    'tiling-padding-horizontal': 20,
    'animate-on-drawing-changes': true
  },
  sbgnStyleRules: _.clone(this.defaultSbgnStyleRules),
  triggerIncrementalLayout: function () {
    beforePerformLayout();
    var preferences = {
      randomize: false,
      animate: this.sbgnStyleRules['animate-on-drawing-changes'] ? 'end' : false,
      fit: false
    };
    if (sbgnLayoutProp.currentLayoutProperties.animate === 'during') {
      delete preferences.animate;
    }

    sbgnLayoutProp.applyLayout(preferences, false); // layout must not be undoable
  },
  sbgnvizUpdate: function (cyGraph) {
    console.log('cy update called');
    // Reset undo/redo stack and buttons when a new graph is loaded
    cy.undoRedo().reset();
    this.resetUndoRedoButtons();
    cy.startBatch();
    // clear data
    cy.remove('*');
    cy.add(cyGraph);
    cy.nodes().addClass('changeLabelTextSize');
    //add position information to data for preset layout
    var positionMap = {};
    for (var i = 0; i < cyGraph.nodes.length; i++) {
      var xPos = cyGraph.nodes[i].data.sbgnbbox.x;
      var yPos = cyGraph.nodes[i].data.sbgnbbox.y;
      positionMap[cyGraph.nodes[i].data.id] = {'x': xPos, 'y': yPos};
    }
    cy.layout({
      name: 'preset',
      positions: positionMap
    }
    );
    refreshPaddings();
    cy.endBatch();
    cy.edgeBendEditing('get').initBendPoints(cy.edges());
  },
  getExpandCollapseOptions: function () {
    var self = this;
    return {
      fisheye: function () {
        return self.sbgnStyleRules['rearrange-after-expand-collapse'];
      },
      animate: function () {
        return self.sbgnStyleRules['animate-on-drawing-changes'];
      },
      layoutBy: function () {
        if (!self.sbgnStyleRules['rearrange-after-expand-collapse']) {
          return;
        }

        self.triggerIncrementalLayout();
      }
    };
  },
  dynamicResize: function () {
    var win = $(this); //this = window

    var windowWidth = win.width();
    var windowHeight = win.height();
    var canvasWidth = 1000;
    var canvasHeight = 680;
    if (windowWidth > canvasWidth)
    {
      $("#sbgn-network-container").width(windowWidth * 0.9);
      var w = $("#sbgn-inspector-and-canvas").width();
      $(".nav-menu").width(w);
      $(".navbar").width(w);
      $("#sbgn-toolbar").width(w);
    }

    if (windowHeight > canvasHeight)
    {
      $("#sbgn-network-container").height(windowHeight * 0.85);
      $("#sbgn-inspector").height(windowHeight * 0.85);
    }
  },
  getInfoLabel: function (node) {
    /* Info label of a collapsed node cannot be changed if
     * the node is collapsed return the already existing info label of it
     */
    if (node._private.data.collapsedChildren != null) {
      return node._private.data.infoLabel;
    }

    /*
     * If the node is simple then it's infolabel is equal to it's sbgnlabel
     */
    if (node.children() == null || node.children().length == 0) {
      return node._private.data.sbgnlabel;
    }

    var children = node.children();
    var infoLabel = "";
    /*
     * Get the info label of the given node by it's children info recursively
     */
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var childInfo = this.getInfoLabel(child);
      if (childInfo == null || childInfo == "") {
        continue;
      }

      if (infoLabel != "") {
        infoLabel += ":";
      }
      infoLabel += childInfo;
    }

    //return info label
    return infoLabel;
  },
  nodeQtipFunction: function (node) {
    /*    * Check the sbgnlabel of the node if it is not valid
     * then check the infolabel if it is also not valid do not show qtip
     */
    var label = node._private.data.sbgnlabel;
    if (label == null || label == "")
      label = this.getInfoLabel(node);
    if (label == null || label == "")
      return;
    node.qtip({
      content: function () {
        var contentHtml = "<b style='text-align:center;font-size:16px;'>" + label + "</b>";
        var sbgnstatesandinfos = node._private.data.sbgnstatesandinfos;
        for (var i = 0; i < sbgnstatesandinfos.length; i++) {
          var sbgnstateandinfo = sbgnstatesandinfos[i];
          if (sbgnstateandinfo.clazz == "state variable") {
            var value = sbgnstateandinfo.state.value;
            var variable = sbgnstateandinfo.state.variable;
            var stateLabel = (variable == null /*|| typeof stateVariable === undefined */) ? value :
                    value + "@" + variable;
            if (stateLabel == null) {
              stateLabel = "";
            }
            contentHtml += "<div style='text-align:center;font-size:14px;'>" + stateLabel + "</div>";
          }
          else if (sbgnstateandinfo.clazz == "unit of information") {
            var stateLabel = sbgnstateandinfo.label.text;
            if (stateLabel == null) {
              stateLabel = "";
            }
            contentHtml += "<div style='text-align:center;font-size:14px;'>" + stateLabel + "</div>";
          }
        }
        return contentHtml;
      },
      show: {
        ready: true
      },
      position: {
        my: 'top center',
        at: 'bottom center',
        adjust: {
          cyViewport: true
        }
      },
      style: {
        classes: 'qtip-bootstrap',
        tip: {
          width: 16,
          height: 8
        }
      }
    });
  },
  refreshUndoRedoButtonsStatus: function () {
    var ur = cy.undoRedo();
    if (ur.isUndoStackEmpty()) {
      $("#undo-last-action").parent("li").addClass("disabled");
    }
    else {
      $("#undo-last-action").parent("li").removeClass("disabled");
    }

    if (ur.isRedoStackEmpty()) {
      $("#redo-last-action").parent("li").addClass("disabled");
    }
    else {
      $("#redo-last-action").parent("li").removeClass("disabled");
    }
  },
  resetUndoRedoButtons: function () {
    $("#undo-last-action").parent("li").addClass("disabled");
    $("#redo-last-action").parent("li").addClass("disabled");
  },
  calculatePaddings: function (paddingPercent) {
    //As default use the compound padding value
    if (!paddingPercent) {
      paddingPercent = parseInt(this.sbgnStyleRules['compound-padding'], 10);
    }

    var nodes = cy.nodes();
    var total = 0;
    var numOfSimples = 0;
    for (var i = 0; i < nodes.length; i++) {
      var theNode = nodes[i];
      if (theNode.children() == null || theNode.children().length == 0) {
        total += Number(theNode.width());
        total += Number(theNode.height());
        numOfSimples++;
      }
    }

    var calc_padding = (paddingPercent / 100) * Math.floor(total / (2 * numOfSimples));
    if (calc_padding < 5) {
      calc_padding = 5;
    }

    return calc_padding;
  },
  calculateTilingPaddings: this.calculatePaddings,
  calculateCompoundPaddings: this.calculatePaddings,
  refreshPaddings: function () {
    var calc_padding = this.calculateCompoundPaddings();
    var nodes = cy.nodes();
    nodes.css('padding-left', 0);
    nodes.css('padding-right', 0);
    nodes.css('padding-top', 0);
    nodes.css('padding-bottom', 0);
    var compounds = nodes.filter('$node > node');
    compounds.css('padding-left', calc_padding);
    compounds.css('padding-right', calc_padding);
    compounds.css('padding-top', calc_padding);
    compounds.css('padding-bottom', calc_padding);
  }
};

module.exports = commonAppUtilities;