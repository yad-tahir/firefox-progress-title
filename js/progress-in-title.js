// Copyright (C) 2019

// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA
// 02110-1301, USA.

(function() {
	'use strict';

	var docTitle = ""
	var appTitle = ""
	var nodeLoaded = 0;
	var nodeInserted = 1; // to avoid dividing by zero
	var loadingMode = true;
	var firstScroll = true;

	const listenerConfig = {"once": true, "capture": true, "passive": true};

	function updateTitle(node, progress, force){
		if (progress >= 0){
			if (progress > 100)
				progress = 100;

			if(appTitle != "" &&
			   appTitle != docTitle &&
			   (loadingMode || force)){
				docTitle = appTitle.concat(" ", Math.ceil(progress), "%");
				document.title = docTitle;
			}
		}
	}

	function onMediaUpdateHandler(node){
		var x = node.offsetLeft,
			y = node.offsetTop,
			w = node.offsetWidth,
			h = node.offsetHeight,
			r = x + w, //right
			b = y + h, //bottom
			visibleX, visibleY, visible;

		visibleX = Math.max(0, Math.min(w, window.pageXOffset + window.innerWidth - x, r - window.pageXOffset));
		visibleY = Math.max(0, Math.min(h, window.pageYOffset + window.innerHeight - y, b - window.pageYOffset));
		visible = visibleX * visibleY / (w * h);

		if(loadingMode)
			loadingMode = false;

		// Update the title when the visibility at least is 10%
		if(visible > 0.1)
			updateTitle(node, node.currentTime * 100 / node.duration, true);
	}

	function onScrollHandler(node){
		var p = node.scrollY * 100 / node.scrollMaxY;
		// Ignore the very first scroll as it is triggered automatically without
		// the user actually scrolls the window
		if(firstScroll){
			firstScroll = false;
		}else{
			if(loadingMode)
				loadingMode = false;
		}
		updateTitle(node, p, true);
	}

	function onUnloadHandler(node){
		nodeInserted=20;
		nodeLoaded=20;
		updateTitle(node,100);
	}

	function onLoadHandler(node){
		nodeLoaded++;
		updateTitle(node, nodeLoaded * 100 / nodeInserted);
	}

	function onErrorHandler(node){
		onLoadHandler(node, nodeLoaded * 100 / nodeInserted);
	}

	function setTimeoutTimer(node){
		setTimeout(function(){
			updateTitle(node, 100);
			loadingMode = false;
		}, 20000);
	}

	let observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeName == "TITLE"){
					if (node.text != docTitle){
						appTitle = node.text;
					}
					updateTitle(node, nodeLoaded * 100 / nodeInserted, true);

					var titleObserver =
						new MutationObserver((m) => {
							// If it is not our update
							var n = m[0].addedNodes[0];
							// If the last char of the new title is '%'. This means
							// this update is coming from our script. Thus, ignore it.
							if (n.textContent != docTitle &&
								n.textContent.slice(-1) != "%"){
								appTitle = n.textContent;
								updateTitle(n, nodeLoaded * 100 / nodeInserted, true);
							}
						});
					titleObserver.observe (node , {childList: true,
												   attributes: true});
					setTimeoutTimer(node);
				} else if (node.nodeName == "BODY"){
					nodeInserted++;
					updateTitle(node, nodeLoaded * 100 / nodeInserted);
					node.addEventListener( "load", () => onLoadHandler(node),
										   listenerConfig);
				} else if (((node.nodeName == "IMG" ||
							 node.nodeName == "SCRIPT" ||
							 node.nodeName == "IFRAME" ||
							 node.nodeName == "FRAME") && node.src != "") ||
						   (node.nodeName == "LINK" &&
							node.rel == "stylesheet" &&
							window.matchMedia(node.media))) {
					nodeInserted++;
					updateTitle(node);
					node.addEventListener("load", () => onLoadHandler(node),
										  listenerConfig);
					node.addEventListener("error", () => onErrorHandler(node),
										  listenerConfig);
					node.addEventListener("abort", () => onErrorHandler(node),
										  listenerConfig);
				} else if (node.nodeName == "VIDEO" ||
						   node.nodeName == "AUDIO"){
					nodeInserted++;
					updateTitle(node, nodeLoaded * 100 / nodeInserted);
					node.addEventListener("load", () => onLoadHandler(node),
										  listenerConfig);
					node.addEventListener("abort", () => onUnloadHandler(node),
										  listenerConfig);
					node.addEventListener("error", () => onUnloadHandler(node),
										  listenerConfig);
					node.addEventListener("timeupdate", () => onMediaUpdateHandler(node),
										  {"passive": true});
				}
			});
		});
	});

	updateTitle(window, nodeLoaded * 100 / nodeInserted);
	observer.observe(document, {childList: true, subtree: true});
	window.addEventListener( "load",
							 () => onLoadHandler(window), listenerConfig);
	window.addEventListener("scroll",
							() => onScrollHandler(window));
})();
