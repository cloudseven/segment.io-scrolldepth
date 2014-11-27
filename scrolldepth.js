;(function () {

    "use strict";

    var options = {
        minHeight: 0,
        elements: document.querySelectorAll('[data-track-scroll]'),
        percentage: true,
        userTiming: true,
        pixelDepth: true,
        nonInteraction: true
    };

    var cache = [],
        lastPixelDepth = 0;

    /*
     * Plugin
     */
    var startTime = +new Date;

    // Return early if document height is too small
    if ( document.body.clientHeight < options.minHeight ) {
        return;
    }

    if (options.percentage) {
        // Establish baseline (0% scroll)
        sendEvent('Percentage', 'Baseline');
    } else if (options.elements) {
        sendEvent('Elements', 'Baseline');
    }

    /*
     * Functions
     */

    function sendEvent(action, label, scrollDistance, timing) {
        console.log(action, label, scrollDistance, timing);
        analytics.track(document.location.pathname, {
            exposed: label
        });
    }

    function calculateMarks(docHeight) {
        return {
            '25%' : parseInt(docHeight * 0.25, 10),
            '50%' : parseInt(docHeight * 0.50, 10),
            '75%' : parseInt(docHeight * 0.75, 10),
            // 1px cushion to trigger 100% event in iOS
            '100%': docHeight - 5
        };
    }

    function checkMarks(marks, scrollDistance, timing) {
        // Check each active mark
        for (var key in marks) {
            if (cache.indexOf(key) === -1 && scrollDistance >= marks[key]) {
                sendEvent('Percentage', key, scrollDistance, timing);
                cache.push(key);
            }
        }
    }

    function checkElements(elements, scrollDistance, timing) {
        [].forEach.call(elements, function(elem){
            if ( cache.indexOf(elem) === -1 && cache.length ) {
                if ( scrollDistance >= offSet(elem).top ) {
                    var label = elem.id || elem.classList;
                    sendEvent('Elements', label, scrollDistance, timing);
                    cache.push(elem);
                }
            }
        });
    }

    function offSet(elem){
        var rect = elem.getBoundingClientRect();
        return {
            top: rect.top + document.body.scrollTop,
            left: rect.left + document.body.scrollLeft
        }
    }

    /*
     * Throttle function borrowed from:
     * Underscore.js 1.5.2
     * http://underscorejs.org
     * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Underscore may be freely distributed under the MIT license.
     */

    function throttle(func, wait) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        var later = function() {
            previous = new Date;
            timeout = null;
            result = func.apply(context, args);
        };
        return function() {
            var now = new Date;
            if (!previous) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0) {
                clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = func.apply(context, args);
            } else if (!timeout) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    }

    /*
     * Scroll Event
     */

    var scrollHandler = throttle(function() {
        /*
         * We calculate document and window height on each scroll event to
         * account for dynamic DOM changes.
         */

        var docHeight = Math.max( document.body.scrollHeight, document.body.offsetHeight,
                document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight),

            winHeight = window.innerHeight ? window.innerHeight : window.screen.height,
            scrollDistance = document.querySelector('body').scrollTop + winHeight,

        // Recalculate percentage marks
            marks = calculateMarks(docHeight),

        // Timing
            timing = +new Date - startTime;

        // If all marks already hit, unbind scroll event
        if (cache.length >= 4 + options.elements.length) {
            window.removeEventListener('scroll', scrollHandler);
            return;
        }

        // Check specified DOM elements
        if (options.elements) {
            checkElements(options.elements, scrollDistance, timing);
        }

        // Check standard marks
        if (options.percentage) {
            checkMarks(marks, scrollDistance, timing);
        }
    }, 500);

    window.addEventListener('scroll', scrollHandler);

})();
