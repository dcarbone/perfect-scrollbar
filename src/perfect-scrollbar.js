/* Copyright (c) 2012 HyeonJe Jun (http://github.com/noraesae)
 * Licensed under the MIT License
 */
((function ($) {

    // The default settings for the plugin
    var defaultSettings = {
        wheelSpeed: 10,
        wheelPropagation: false
    };

    $.fn.perfectScrollbar = function (suppliedSettings, option) {

        return this.each(function () {
            // Use the default settings
            var settings = $.extend(true, {}, defaultSettings);
            if (typeof suppliedSettings === "object") {
                // But over-ride any supplied
                $.extend(true, settings, suppliedSettings);
            } else {
                // If no settings were supplied, then the first param must be the option
                option = suppliedSettings;
            }

            /*
             If they are calling a method
             */
            if (option === "update") option = "updateBarSizeAndPosition";
            if (typeof option === 'string' && typeof $(this).data('perfect-scrollbar-' + option) === "function") {
                $(this).data('perfect-scrollbar-' + option)();
                return $(this);
            }

            if ($(this).data('perfect-scrollbar')) {
                // if there's already perfect-scrollbar
                return $(this).data('perfect-scrollbar');
            }

            var $this = $(this).addClass('ps-container'),
                $scrollbarX = $("<div class='ps-scrollbar-x ps-active'></div>").appendTo($this),
                $scrollbarY = $("<div class='ps-scrollbar-y ps-active'></div>").appendTo($this),
                containerWidth,
                containerHeight,
                contentWidth,
                contentHeight,
                scrollbarXWidth,
                scrollbarXLeft,
                scrollbarXBottom = parseInt($scrollbarX.css('bottom'), 10),
                scrollbarYHeight,
                scrollbarYTop,
                scrollbarYRight = parseInt($scrollbarY.css('right'), 10),
                psMethods;

            var updateContentScrollTop = function () {
                var scrollTop = parseInt(scrollbarYTop * contentHeight / containerHeight, 10);
                $this.scrollTop(scrollTop);
                $scrollbarX.css({bottom: scrollbarXBottom - scrollTop});
            };

            var updateContentScrollLeft = function () {
                var scrollLeft = parseInt(scrollbarXLeft * contentWidth / containerWidth, 10);
                $this.scrollLeft(scrollLeft);
                $scrollbarY.css({right: scrollbarYRight - scrollLeft});
            };

            var updateScrollbarCss = function () {
                $scrollbarX.css({left: scrollbarXLeft + $this.scrollLeft(), bottom: scrollbarXBottom - $this.scrollTop(), width: scrollbarXWidth});
                $scrollbarY.css({top: scrollbarYTop + $this.scrollTop(), right: scrollbarYRight - $this.scrollLeft(), height: scrollbarYHeight});
            };

            var moveBarX = function (currentLeft, deltaX) {
                var newLeft = currentLeft + deltaX,
                    maxLeft = containerWidth - scrollbarXWidth;

                if (newLeft < 0) {
                    scrollbarXLeft = 0;
                }
                else if (newLeft > maxLeft) {
                    scrollbarXLeft = maxLeft;
                }
                else {
                    scrollbarXLeft = newLeft;
                }
                $scrollbarX.css({left: scrollbarXLeft + $this.scrollLeft()});
            };

            var moveBarY = function (currentTop, deltaY) {
                var newTop = currentTop + deltaY,
                    maxTop = containerHeight - scrollbarYHeight;

                if (newTop < 0) {
                    scrollbarYTop = 0;
                }
                else if (newTop > maxTop) {
                    scrollbarYTop = maxTop;
                }
                else {
                    scrollbarYTop = newTop;
                }
                $scrollbarY.css({top: scrollbarYTop + $this.scrollTop()});
            };

            var bindMouseScrollXHandler = function () {
                var currentLeft,
                    currentPageX;

                $scrollbarX.on('mousedown.perfect-scroll', function (e) {
                    currentPageX = e.pageX;
                    currentLeft = $scrollbarX.position().left;
                    $scrollbarX.addClass('in-scrolling');
                    e.stopPropagation();
                    e.preventDefault();
                });

                $(document).on('mousemove.perfect-scroll', function (e) {
                    if ($scrollbarX.hasClass('in-scrolling')) {
                        updateContentScrollLeft();
                        moveBarX(currentLeft, e.pageX - currentPageX);
                        e.stopPropagation();
                        e.preventDefault();
                    }
                });

                $(document).on('mouseup.perfect-scroll', function (e) {
                    if ($scrollbarX.hasClass('in-scrolling')) {
                        $scrollbarX.removeClass('in-scrolling');
                    }
                });
            };

            var bindMouseScrollYHandler = function () {
                var currentTop,
                    currentPageY;

                $scrollbarY.on('mousedown.perfect-scroll', function (e) {
                    currentPageY = e.pageY;
                    currentTop = $scrollbarY.position().top;
                    $scrollbarY.addClass('in-scrolling');
                    e.stopPropagation();
                    e.preventDefault();
                });

                $(document).on('mousemove.perfect-scroll', function (e) {
                    if ($scrollbarY.hasClass('in-scrolling')) {
                        updateContentScrollTop();
                        moveBarY(currentTop, e.pageY - currentPageY);
                        e.stopPropagation();
                        e.preventDefault();
                    }
                });

                $(document).on('mouseup.perfect-scroll', function (e) {
                    if ($scrollbarY.hasClass('in-scrolling')) {
                        $scrollbarY.removeClass('in-scrolling');
                    }
                });
            };

            // bind handlers
            var bindMouseWheelHandler = function () {
                var shouldPreventDefault = function (deltaX, deltaY) {
                    var scrollTop = $this.scrollTop();
                    if (scrollTop === 0 && deltaY > 0 && deltaX === 0) {
                        return !settings.wheelPropagation;
                    }
                    else if (scrollTop >= contentHeight - containerHeight && deltaY < 0 && deltaX === 0) {
                        return !settings.wheelPropagation;
                    }

                    var scrollLeft = $this.scrollLeft();
                    if (scrollLeft === 0 && deltaX < 0 && deltaY === 0) {
                        return !settings.wheelPropagation;
                    }
                    else if (scrollLeft >= contentWidth - containerWidth && deltaX > 0 && deltaY === 0) {
                        return !settings.wheelPropagation;
                    }
                    return true;
                };

                $this.on('mousewheel.perfect-scroll', function (e, delta, deltaX, deltaY) {
                    $this.scrollTop($this.scrollTop() - (deltaY * settings.wheelSpeed));
                    $this.scrollLeft($this.scrollLeft() + (deltaX * settings.wheelSpeed));

                    // update bar position
                    $this.data('perfect-scrollbar-updateBarSizeAndPosition')();

                    if (shouldPreventDefault(deltaX, deltaY)) {
                        e.preventDefault();
                    }
                });
            };

            /**
             * Bind event listeners for touch events
             */
            var bindTouchScreenHandler = function () {
                var applyTouchMove = function (differenceX, differenceY) {
                    $this.scrollTop($this.scrollTop() - differenceY);
                    $this.scrollLeft($this.scrollLeft() - differenceX);

                    // update bar position
                    $this.data('perfect-scrollbar-updateBarSizeAndPosition')();
                };

                var startCoords = {},
                    startTime = 0,
                    speed = {},
                    breakingProcess = null,
                    inGlobalTouch = false;

                $(window).on("touchstart.perfect-scroll", function (e) {
                    inGlobalTouch = true;
                });
                $(window).on("touchend.perfect-scroll", function (e) {
                    inGlobalTouch = false;
                });

                $this.on("touchstart.perfect-scroll", function (e) {
                    var touch = e.originalEvent.targetTouches[0];

                    startCoords.pageX = touch.pageX;
                    startCoords.pageY = touch.pageY;

                    startTime = (new Date()).getTime();

                    if (breakingProcess !== null) {
                        clearInterval(breakingProcess);
                    }

                    e.stopPropagation();
                });
                $this.on("touchmove.perfect-scroll", function (e) {
                    if (!inGlobalTouch && e.originalEvent.targetTouches.length === 1) {
                        var touch = e.originalEvent.targetTouches[0];

                        var currentCoords = {};
                        currentCoords.pageX = touch.pageX;
                        currentCoords.pageY = touch.pageY;

                        var differenceX = currentCoords.pageX - startCoords.pageX,
                            differenceY = currentCoords.pageY - startCoords.pageY;

                        applyTouchMove(differenceX, differenceY);
                        startCoords = currentCoords;

                        var currentTime = (new Date()).getTime();
                        speed.x = differenceX / (currentTime - startTime);
                        speed.y = differenceY / (currentTime - startTime);
                        startTime = currentTime;

                        e.preventDefault();
                    }
                });
                $this.on("touchend.perfect-scroll", function (e) {
                    breakingProcess = setInterval(function () {
                        if (Math.abs(speed.x) < 0.01 && Math.abs(speed.y) < 0.01) {
                            clearInterval(breakingProcess);
                            return;
                        }

                        applyTouchMove(speed.x * 30, speed.y * 30);

                        speed.x *= 0.8;
                        speed.y *= 0.8;
                    }, 10);
                });
            };

            var ieSupport = function (version) {
                $this.addClass('ie').addClass('ie' + version);

                var bindHoverHandlers = function () {
                    var mouseenter = function () {
                        $(this).addClass('hover');
                    };
                    var mouseleave = function () {
                        $(this).removeClass('hover');
                    };
                    $this.on('mouseenter.perfect-scroll', mouseenter).on('mouseleave.perfect-scroll', mouseleave);
                    $scrollbarX.on('mouseenter.perfect-scroll', mouseenter).on('mouseleave.perfect-scroll', mouseleave);
                    $scrollbarY.on('mouseenter.perfect-scroll', mouseenter).on('mouseleave.perfect-scroll', mouseleave);
                };

                var fixIe6ScrollbarPosition = function () {
                    updateScrollbarCss = function () {
                        $scrollbarX.css({left: scrollbarXLeft + $this.scrollLeft(), bottom: scrollbarXBottom, width: scrollbarXWidth});
                        $scrollbarY.css({top: scrollbarYTop + $this.scrollTop(), right: scrollbarYRight, height: scrollbarYHeight});
                        $scrollbarX.hide().show();
                        $scrollbarY.hide().show();
                    };
                    updateContentScrollTop = function () {
                        var scrollTop = parseInt(scrollbarYTop * contentHeight / containerHeight, 10);
                        $this.scrollTop(scrollTop);
                        $scrollbarX.css({bottom: scrollbarXBottom});
                        $scrollbarX.hide().show();
                    };
                    updateContentScrollLeft = function () {
                        var scrollLeft = parseInt(scrollbarXLeft * contentWidth / containerWidth, 10);
                        $this.scrollLeft(scrollLeft);
                        $scrollbarY.hide().show();
                    };
                };

                if (version === 6) {
                    bindHoverHandlers();
                    fixIe6ScrollbarPosition();
                }
            };

            // Object of user-callable methods for Perfect Scrollbar
            psMethods = {
                /*
                 Scrollbar Hide Methods
                 */
                "hide" : function() {
                    $scrollbarX.removeClass('ps-active');
                    $scrollbarY.removeClass('ps-active');
                },
                "hideX" : function() {
                    $scrollbarX.removeClass('ps-active');
                },
                "hideY" : function() {
                    $scrollbarY.removeClass('ps-active');
                },
                /*
                 Scrollbar Show Methods
                 */
                "show" : function() {
                    $scrollbarX.addClass('ps-active');
                    $scrollbarY.addClass('ps-active');
                },
                "showX" : function() {
                    $scrollbarX.addClass('ps-active');
                },
                "showY" : function() {
                    $scrollbarY.addClass('ps-active');
                },

                /**
                 * Destroy Perfect Scrollbar
                 *
                 * Removes PS DOM elements & removes
                 * event methods from $.data
                 *
                 * @return void
                 */
                "destroy" : function () {
                    $scrollbarX.remove();
                    $scrollbarY.remove();
                    $this.off('.perfect-scroll');
                    $(window).off('.perfect-scroll');
                    $this.data('perfect-scrollbar', null);

                    for (var x in psMethods)
                    {
                        $this.data('perfect-scrollbar-' + x, null);
                    }
                },

                /**
                 * Updates size & position of scrollbar relative
                 * to container
                 *
                 * @return void
                 */
                "updateBarSizeAndPosition" : function () {
                    containerWidth = $this.width();
                    containerHeight = $this.height();
                    contentWidth = $this.prop('scrollWidth');
                    contentHeight = $this.prop('scrollHeight');
                    if (containerWidth < contentWidth) {
                        scrollbarXWidth = parseInt(containerWidth * containerWidth / contentWidth, 10);
                        scrollbarXLeft = parseInt($this.scrollLeft() * containerWidth / contentWidth, 10);
                    }
                    else {
                        scrollbarXWidth = 0;
                        scrollbarXLeft = 0;
                        $this.scrollLeft(0);
                    }
                    if (containerHeight < contentHeight) {
                        scrollbarYHeight = parseInt(containerHeight * containerHeight / contentHeight, 10);
                        scrollbarYTop = parseInt($this.scrollTop() * containerHeight / contentHeight, 10);
                    }
                    else {
                        scrollbarYHeight = 0;
                        scrollbarYTop = 0;
                        $this.scrollTop(0);
                    }

                    if (scrollbarYTop >= containerHeight - scrollbarYHeight) {
                        scrollbarYTop = containerHeight - scrollbarYHeight;
                    }
                    if (scrollbarXLeft >= containerWidth - scrollbarXWidth) {
                        scrollbarXLeft = containerWidth - scrollbarXWidth;
                    }

                    updateScrollbarCss();
                }
            };

            // Attempt to determine if the client supports a touch-screen interface
            var supportsTouch = (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);

            /**
             * Initialize Perfect Scrollbar
             *
             * Creates elements and attaches event methods
             * to $.data
             *
             * Also optionally ons mousewheel
             *
             * @return void
             */
            var initialize = function () {
                var ieMatch = navigator.userAgent.toLowerCase().match(/(msie) ([\w.]+)/);
                if (ieMatch && ieMatch[1] === 'msie') {
                    // must be executed at first, because 'ieSupport' may addClass to the container
                    ieSupport(parseInt(ieMatch[2], 10));
                }

                psMethods['updateBarSizeAndPosition']();
                bindMouseScrollXHandler();
                bindMouseScrollYHandler();
                if (supportsTouch) {
                    bindTouchScreenHandler();
                }
                if ($this.mousewheel) {
                    bindMouseWheelHandler();
                }
                $this.data('perfect-scrollbar', $this);

                for (var x in psMethods)
                {
                    if (typeof psMethods[x] === 'function')
                    {
                        $this.data('perfect-scrollbar-' + x, psMethods[x]);
                    }
                }
            };

            /*
             If they are initializing
             */
            // initialize
            initialize();

            return $this;
        });
    };
})(jQuery));