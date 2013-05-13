 /////////////////////////////////////////////////////////////////////////
 // jQuery Frame Sequencer
 // https://github.com/mattfordham/Frame-Sequencer 
 //
 // Copyright 2012, Matt Fordham - www.matthewfordham.com / www.wintr.com
 /////////////////////////////////////////////////////////////////////////

(function($){
  
  //////////////////////
  // Default Settings //
  //////////////////////
  
  var defaults = {
    // Sequence type -- "multi-image" or "sprite"
    sequenceType: "multi-image", 
    
    // Multi-image settings
    filePath: "", 
    filePrefix: "", 
    fileExtension: "jpg",
    
    // Sprite settings
    spriteSheet: null,
    columns: 10,
    
    // Global settings    
    autoPlay: false,
    totalFrames: 24,
    startFrame: 1,
    fps: 24,
    width: 100,
    height: 100,
    loop: false,
    yoyo: false,
    
    // Callbacks
    onInit: null,
    onLoaded: null,
    onPlay: null,
    onTick: null,
    onPause: null,
    onEnd: null
  };
  
  ////////////////////
  // Plugin Methods //
  ////////////////////
  
  var methods = {

    init : function(options) {
      
      settings = $.extend({}, defaults, options);
    
      return this.each(function(){
        var $el = $(this);                

        var _settings = $.extend(true, {}, settings)

        $el.data('frameSequencer', {
          settings: _settings,
          imagesLoaded: false,
          playing: false,
          tickTimer: null,
          currentFrame: 1,
          targetFrame: null,
          playingBackwards: false
        });
        
        var data = $el.data('frameSequencer');
        
        var initialStyle = {
          width: data.settings.width, 
          height: data.settings.height, 
          'display': 'block', 
          'overflow': 'hidden' 
        };

        $el.css(initialStyle);

        if (data.settings.onInit){
          data.settings.onInit();
        }
        
        data.currentFrame = data.settings.startFrame;
        
        if (data.settings.sequenceType == "sprite") {
          preloadSprite($el, data.settings.spriteSheet);
        } else if (data.settings.sequenceType == "multi-image") {
          preloadImages($el);
        } else {
          logError("please use 'sprite' or 'multi-image' for sequenceType");
        }
      })

    },
    play : function(){
      return this.each(function(){
        var $el = $(this);
        var data = $el.data('frameSequencer');

        if (data.imagesLoaded) {
          if (data.playing || data.currentFrame == data.settings.totalFrames) {
            clearInterval(data.tickTimer);
            data.currentFrame = 1;
          };
          play($el);
        } else {
          logError("play - sprite not yet loaded");
        };

      });
    }, 
    pause : function(){
      return this.each(function(){
        var $el = $(this);
        var data = $el.data('frameSequencer');

        clearInterval(data.tickTimer);
        data.playing = false;

        if (data.settings.onPause) {
          data.settings.onPause();
        };
      });
    },
    gotoAndStop : function(options){
      return this.each(function(){
        var $el = $(this);
        var data = $el.data('frameSequencer')
        
        if (options && options.frame >= 1) {
          clearInterval(data.tickTimer);
          data.playing = false;
          data.currentFrame = options.frame;
          
          if (data.settings.sequenceType == "sprite") {
            updateBackgroundPosition($el);
          } else if (data.settings.sequenceType == "multi-image") {
            updateVisibleFrame($el);
          }
          
          if (data.settings.onTick) {
            data.settings.onTick(data.currentFrame);
          }
          
        } else {
          logError("gotoAndStop - provide a valid frame");
        };

      });
    }, 
    gotoAndPlay : function(options){
      return this.each(function(){
        var $el = $(this);
        var data = $el.data('frameSequencer');

        if (options && options.frame >= 1) {
          clearInterval(data.tickTimer);
          data.currentFrame = options.frame;

          if (data.currentFrame > data.settings.totalFrames) {
            data.currentFrame = data.settings.totalFrames;
          };        
          play($el);
        } else {
          logError("gotoAndPlay - provide a valid frame");
        };
      })
    },
    playTo : function(options){
      return this.each(function(){
        var $el = $(this);
        var data = $el.data('frameSequencer');

        if (options && options.frame >= 1) {
          clearInterval(data.tickTimer);
          data.targetFrame = options.frame;

          if (data.targetFrame > data.settings.totalFrames) {
            data.targetFrame = data.settings.totalFrames;
          };
          if (data.currentFrame > data.targetFrame) {
            data.currentFrame -= 1;
            data.playingBackwards = true;
          } else {
            data.playingBackwards = false
          }
          if (data.targetFrame != data.currentFrame) {          
            play($el);
          };
        } else {
          logError("playTo - provide a valid frame");
        };
      })
    }
  };
  
  //////////////////////////
  // Main Plugin Function //
  //////////////////////////
  
  $.fn.frameSequencer = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || ! method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.frameSequencer' );
    }    
  };


  /////////////////////
  // Private Methods //
  /////////////////////
  
  // Preload Sprite -- used only for sequenceType = "sprite"
  function preloadSprite($el, image) {
    data = $el.data('frameSequencer');
    img = new Image()
    img.onload = function(){
      data = $el.data('frameSequencer');
      data.imagesLoaded = true
      $el.css('background-image', 'url('+image+')');                  
      if (data.settings.onLoaded){
        data.settings.onLoaded()
      }
      if (data.settings.autoPlay){
        play($el)
      }
    }
    img.src = image;
  }
  
  // Preload Frame Images -- used only for sequenceType = "multi-image"
  function preloadImages($el) {
    data = $el.data('frameSequencer');
    for (var i = 1; i <= data.settings.totalFrames; i++) {
      var image = data.settings.filePath + data.settings.filePrefix + i + "." + data.settings.fileExtension;
      img = new Image()
      img.onload = function(){
        imageLoaded($el);
      }
      img.src = image;
    };
  }
  
  // Check load progress of frame images -- used only for sequenceType = "multi-image"
  function imageLoaded($el) {
    data = $el.data('frameSequencer');
    data.imagesLoaded += 1
    if (data.imagesLoaded == data.settings.totalFrames) {
      if (data.settings.onLoaded){
        data.settings.onLoaded()
      }
      initFrames($el);
    };
  }
  
  // Initiaze img elements -- used only for sequenceType = "multi-image"
  function initFrames($el) {
    data = $el.data('frameSequencer');
    for (var i = 1; i <= data.settings.totalFrames; i++) {
      var image = data.settings.filePath + data.settings.filePrefix + i + "." + data.settings.fileExtension;
      var frame = "<img src='" + image + "' class='frame' id='frame-" + i + "'>";
      $el.append(frame);
    };
    $('.frame', $el).hide().first().css({display: "block"});
    if (data.settings.autoPlay){
      play($el)
    }  
  }
  
  // Start playback
  function play($el){
    data = $el.data('frameSequencer');
    data.playing = true;
    tick($el);
    data.tickTimer = setInterval(function(){tick($el)}, 1000/data.settings.fps);
    if (data.settings.onPlay) {
      data.settings.onPlay()
    }
  }
  
  // Interval to update sequence
  function tick($el) {
    data = $el.data('frameSequencer');
    
    if (data.settings.sequenceType == "sprite") {
      updateBackgroundPosition($el);
    } else if (data.settings.sequenceType == "multi-image") {
      updateVisibleFrame($el);
    }

    if (data.settings.onTick) {
      data.settings.onTick(data.currentFrame);
    }

    if (data.playingBackwards) {
      if (data.settings.yoyo && data.currentFrame == 1) {
        data.playingBackwards = false;
        data.currentFrame ++
      } else if (data.currentFrame == 1 || data.currentFrame == data.targetFrame) {

        if (data.settings.loop && data.targetFrame == null) {
          data.currentFrame = data.settings.totalFrames;
        } else {
          data.playingBackwards = false;
          data.playing = false;
          clearInterval(data.tickTimer);
        };

        if(data.settings.onEnd) {
          setTimeout(function(){
            data.settings.onEnd($el);
          }, 1000/data.settings.fps);
        }
        
        data.targetFrame = null;
      } else {
        data.currentFrame --;
      }
    } else {
      if (data.currentFrame == data.settings.totalFrames || data.currentFrame == data.targetFrame){ 
        if (data.settings.yoyo) {
          data.playingBackwards = true
          data.currentFrame --;
        } else if (data.settings.loop && data.targetFrame == null){
          data.currentFrame = 1;
        } else {
          data.playing = false;
          clearInterval(data.tickTimer);
        }
        
        if(data.settings.onEnd) {
          setTimeout(function(){
            data.settings.onEnd($el);
          }, 1000/data.settings.fps);
        }
        
        data.targetFrame = null;
        
      } else {
        data.currentFrame ++;
      }
    };
  };
  
  // Set background position of sprite -- used only for sequenceType = "sprite"
  function updateBackgroundPosition($el) {
    data = $el.data('frameSequencer');

    var currentRow, currentColumn, xOffset, yOffset;
    
    currentRow = Math.floor((data.currentFrame-1) / data.settings.columns);
    currentColumn = (data.currentFrame-1) % data.settings.columns;
    xOffset = -(data.settings.width * currentColumn)
    yOffset = -(data.settings.height * currentRow)
    
    $el.css('background-position', xOffset+"px "+yOffset+"px")
  }
  
  // Set visible frame image -- used only for sequenceType = "multi-image"
  function updateVisibleFrame($el) {
    data = $el.data('frameSequencer');
    $('.frame', $el).hide();
    $('#frame-' + data.currentFrame, $el).show()
  }
  
  // Log errors
  function logError(message) {
    console.log("Frame Sequencer Error: "+ message);
  }

})(jQuery);