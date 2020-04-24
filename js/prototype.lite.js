/*  Prototype JavaScript framework
 *  (c) 2005 Sam Stephenson <sam@conio.net>
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://prototype.conio.net/
/*--------------------------------------------------------------------------*/

//note: modified & stripped down version of prototype, to be used with moo.fx by mad4milk (http://moofx.mad4milk.net).
var Prototype = {
  Version: '1.5.1',
  Browser: {
    IE:     !!(window.attachEvent && !window.opera),
    Opera:  !!window.opera,
    WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    Gecko:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1
  },

  BrowserFeatures: {
    XPath: !!document.evaluate,
    ElementExtensions: !!window.HTMLElement,
    SpecificElementExtensions:
      (document.createElement('div').__proto__ !==
       document.createElement('form').__proto__)
  },

  ScriptFragment: '<script[^>]*>([\u0001-\uFFFF]*?)</script>',
  JSONFilter: /^\/\*-secure-\s*(.*)\s*\*\/\s*$/,

  emptyFunction: function() { },
  K: function(x) { return x }
}

var Class = {
	create: function() {
		return function() {
			this.initialize.apply(this, arguments);
		}
	}
}

Object.extend = function(destination, source) {
	for (property in source) destination[property] = source[property];
	return destination;
}

Function.prototype.bind = function() {
  var __method = this, args = $A(arguments), object = args.shift();
  return function() {
    return __method.apply(object, args.concat($A(arguments)));
  }
}

Function.prototype.bindAsEventListener = function() {
  var __method = this, args = $A(arguments), object = args.shift();
  return function(event) {
    return __method.apply(object, [event || window.event].concat(args));
  }
}

Function.prototype.methodize = function() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      return __method.apply(null, [this].concat($A(arguments)));
    };
}


var $A = Array.from = function(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) {
    return iterable.toArray();
  } else {
    var results = [];
    for (var i = 0, length = iterable.length; i < length; i++)
      results.push(iterable[i]);
    return results;
  }
}
function $() {
	if (arguments.length == 1) return get$(arguments[0]);
	var elements = [];
	$c(arguments).each(function(el){
		elements.push(get$(el));
	});
	return elements;

	function get$(el){
//		console.debug(el);
		if (typeof el == 'string') el = document.getElementById(el);
		if (typeof el == 'object') Object.extend(el,add_option);
		return el;
	}
}

if (!window.Element) var Element = new Object();

Object.extend(Element, {
	remove: function(element) {
		element = $(element);
		element.parentNode.removeChild(element);
	},

	hasClassName: function(element, className) {
		element = $(element);
		if (!element) return;
		var hasClass = false;
		element.className.split(' ').each(function(cn){
			if (cn == className) hasClass = true;
		});
		return hasClass;
	},

	addClassName: function(element, className) {
		element = $(element);
		Element.removeClassName(element, className);
		element.className += ' ' + className;
	},

	removeClassName: function(element, className) {
		element = $(element);
		if (!element) return;
		var newClassName = '';
		element.className.split(' ').each(function(cn, i){
			if (cn != className){
				if (i > 0) newClassName += ' ';
				newClassName += cn;
			}
		});
		element.className = newClassName;
	},

	cleanWhitespace: function(element) {
		element = $(element);
		$c(element.childNodes).each(function(node){
			if (node.nodeType == 3 && !/\S/.test(node.nodeValue)) Element.remove(node);
		});
	},

	find: function(element, what) {
		element = $(element)[what];
		while (element.nodeType != 1) element = element[what];
		return element;
	},
	getElementSize:function(element){
		var size_obj = (typeof element == 'string') ? document.getElementById(element) : element;
		var width = parseInt(size_obj.offsetWidth);
		var height = parseInt(size_obj.offsetHeight);
		return ({width : width , height : height});
	},
	getElementStyle:function(element,style){
		var size_obj = (typeof element == 'string') ? document.getElementById(element) : element;
		var css = document.defaultView.getComputedStyle(size_obj, null);
		var rtn = null;
		for(p in css){
			if(p == style) return css[p];
		}
	}
});

if (!window.Event) var Event = new Object();
Object.extend(Event, {
	pointerX:function(e){
	 	return e.pageX || (e.clientX +
    			    (document.documentElement.scrollLeft || document.body.scrollLeft));
	},
	pointerY:function(e){
	 	return e.pageY || (e.clientY +
					(document.documentElement.scrollTop || document.body.scrollTop));
	},
	Event_element: function(e) {
    		return e.target || e.srcElement;
  	},
  	getTarget : function(e){
  		if(e.target){
  			return e.target;
		}else{
			return e.srcElement;
		}
  	},
  	stop : function(e){
  		if(Prototype.Browser.IE){
			window.event.cancelBubble = true;
			window.event.returnValue = false;
		}else{
			e.preventDefault();
			e.stopPropagation();
			e.stopped = true;
		}
  	}
});


Object.extend(String.prototype, {
	camelize: function() {
    var parts = this.split('-'), len = parts.length;
    if (len == 1) return parts[0];

    var camelized = this.charAt(0) == '-'
      ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
      : parts[0];

    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

    return camelized;
  },
  times: function(count) {
	    return count < 1 ? '' : new Array(count + 1).join(this);
  }
});

var Position = {
	cumulativeOffset: function(element) {
		var valueT = 0, valueL = 0;
		do {
			valueT += element.offsetTop  || 0;
			valueL += element.offsetLeft || 0;
			element = element.offsetParent;
		} while (element);
//		return [valueL, valueT];
		return {top : valueT , left : valueL};
	}
};

document.getElementsByClassName = function(className) {
	var children = document.getElementsByTagName('*') || document.all;
	var elements = [];
	$c(children).each(function(child){
		if (Element.hasClassName(child, className)) elements.push(child);
	});
	return elements;
}

//useful array functions
//Array.prototype.iterate = function(func){
//	for(var i=0;i<this.length;i++) func(this[i], i);
//}
//if (!Array.prototype.each) Array.prototype.each = Array.prototype.iterate;

Object.extend(Array.prototype, {
	_each: function(iterator) {
    	for (var i = 0, length = this.length; i < length; i++)
    		iterator(this[i]);
  	},
	each: function(iterator, context) {
    	var index = 0;
    	try {
    		this._each(function(value) {
    			iterator.call(context, value, index++);
    		});
    	} catch (e) {
//    		if (e != $break) throw e;
    	}
    	return this;
  	},
	collect: function(iterator, context) {
    	iterator = iterator || Prototype.K;
    	var results = [];
    	this.each(function(value, index) {
    		results.push(iterator.call(context, value, index));
    	});
    	return results;
  	},
  	inject: function(memo, iterator, context) {
  	    this.each(function(value, index) {
  	      memo = iterator.call(context, memo, value, index);
  	    });
  	    return memo;
  	},
  	reject: function(iterator, context) {
  		var results = [];
  		this.each(function(value, index) {
  			if (!iterator.call(context, value, index))
  				results.push(value);
  		});
  		return results;
  	}
});
(function(){
	var methods = ['abs','round','ceil','floor'];
	methods.each(function(method){
		  Number.prototype[method] = Math[method].methodize();
	})
})();

function $c(array){
	var nArray = [];
	for (var i=0;i<array.length;i++) nArray.push(array[i]);
	return nArray;
}

var $A = Array.from = function(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) {
    return iterable.toArray();
  } else {
    var results = [];
    for (var i = 0, length = iterable.length; i < length; i++)
      results.push(iterable[i]);
    return results;
  }
}

var add_option = {
	setStyle: function(styles, camelized) {
    	var elementStyle = this.style;
		for (var property in styles){
			try{
			if (property == 'opacity') this.setOpacity(styles[property])
			else
				elementStyle[(property == 'float' || property == 'cssFloat') ?
				(elementStyle.styleFloat === undefined ? 'cssFloat' : 'styleFloat') :
				(camelized ? property : property.camelize())] = styles[property];
			}catch(e){
				alert(styles[property]+" "+property);
			}
		}
   		return this;
  	},
	setOpacity: function(value) {
		this.style.opacity = (value == 1 || value === '') ? '' :
		(value < 0.00001) ? 0 : value;
		return this;
	},
	getStyle: function(style) {
    	style = style == 'float' ? 'cssFloat' : style.camelize();
    	var value = this.style[style];
    	if (!value) {
    		var css;
    		if(typeof document.defaultView != 'undefined'){
    			css = document.defaultView.getComputedStyle(this, null);
    		}else css = null;
    		value = css ? css[style] : null;
    	}
//		if (style == 'opacity') return value ? parseFloat(value) : 1.0;
    	return value == 'auto' ? null : value;
 	},
 	getDimensions: function() {
 		var display = this.getStyle('display');
 		  if (display != 'none' && display != null) // Safari bug
 		    return {width: this.offsetWidth, height: this.offsetHeight};

 	    // All *Width and *Height properties give 0 on elements with display none,
 	    // so enable the element temporarily
 	    var els = this.style;
 	    var originalVisibility = els.visibility;
 	    var originalPosition = els.position;
 	    var originalDisplay = els.display;
 	    els.visibility = 'hidden';
 	    els.position = 'absolute';
 	    els.display = 'block';
 	    var originalWidth = this.clientWidth;
 	    var originalHeight = this.clientHeight;
 	    els.display = originalDisplay;
 	    els.position = originalPosition;
 	    els.visibility = originalVisibility;
 	    return {width: originalWidth, height: originalHeight};
 	 },
	show : function(){
		this.style.display = '';
	},
	hide : function(){
		this.style.display = 'none';
	}
}

function addEvent(node,evt,func){
	if(node.addEventListener){
		node.addEventListener(evt,func,false);
	}else if (node.attachEvent){
		node.attachEvent("on"+evt,func);
	}
}
function removeEvent(node,evt,func){
	if(node.removeEventListener){
		node.removeEventListener(evt,func,false);
	}else if (node.detachEvent){
		node.detachEvent("on"+evt,func);
	}
}

function getXMLHttpRequest(){
	var xmlhttp;
	try{
		xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
	}
	catch(e){
//		alert("Msxml2.XMLHTTP error");
		try{
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		catch(e){
//			alert("Microsoft.XMLHTTP error");
			xmlhttp = undefined;
		}
	}
	if(!xmlhttp){
		xmlhttp = new XMLHttpRequest();
	}
	return xmlhttp;
}