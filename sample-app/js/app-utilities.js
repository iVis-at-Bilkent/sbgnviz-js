var appUtilities = {
  sbgnNetworkContainer: undefined,
  layoutPropertiesView: undefined,
  generalPropertiesView: undefined,
  pathsBetweenQueryView: undefined,
  getLayoutProperties: function() {
    if (this.layoutPropertiesView === undefined) {
      return undefined;
    }
    return this.layoutPropertiesView.currentLayoutProperties;
  },
  getSbgnProperties: function() {
    if (this.generalPropertiesView === undefined) {
      return undefined;
    }
    return this.generalPropertiesView.currentSBGNProperties;
  },
  setFileContent: function (fileName) {
    var span = document.getElementById('file-name');
    while (span.firstChild) {
      span.removeChild(span.firstChild);
    }
    span.appendChild(document.createTextNode(fileName));
  },
  triggerIncrementalLayout: function () {
    // If 'animate-on-drawing-changes' is false then animate option must be 'end' instead of false
    // If it is 'during' use it as is. Set 'randomize' and 'fit' options to false
    var preferences = {
      randomize: false,
      animate: this.getLayoutProperties().animateOnDrawingChanges ? 'end' : false,
      fit: false
    };
    if (this.layoutPropertiesView.currentLayoutProperties.animate === 'during') {
      delete preferences.animate;
    }

    this.layoutPropertiesView.applyLayout(preferences, true); // layout must not be undoable
  },
  getExpandCollapseOptions: function () {
    var self = this;
    return {
      fisheye: function () {
        return self.getSbgnProperties().rearrangeAfterExpandCollapse;
      },
      animate: function () {
        return self.getSbgnProperties().animateOnDrawingChanges;
      },
      layoutBy: function () {
        if (!self.getSbgnProperties().rearrangeAfterExpandCollapse) {
          return;
        }

        self.triggerIncrementalLayout();
      }
    };
  },
  dynamicResize: function () {
    var win = $(window);//$(this); //this = window

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
  nodeQtipFunction: function (node) {
    node.qtip({
      content: function () {
        return sbgnviz.getQtipContent(node);
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
  }
};

module.exports = appUtilities;