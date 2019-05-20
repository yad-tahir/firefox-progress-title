(function() {
	'use strict';

	var docTitle = ""
	var appTitle = ""
	var lastProgress = 0;
	var nodeLoaded = 0;
	var nodeInserted = 0;
	var mediaMode = false;

	const listenerConfig = {"once": true, "capture": true, "passive": true};

	function updateTitle(node, progress){
		if(typeof progress === "undefined"){
			progress = nodeLoaded * 100 / nodeInserted;
		}

		if (progress >= 0){
			if (progress > 100){
				progress = 100;
			}

			if(appTitle != "" &&
			   appTitle != docTitle &&
			   (!mediaMode || (node.nodeName == "VIDEO" ||
							   node.nodeName == "VOICE"))){
				lastProgress = progress;
				docTitle = appTitle.concat(" - ", Math.ceil(progress), "%");
				document.title = docTitle;
			}
		}
	}

	function onTimeUpdateHandler(node){
		if(!mediaMode)
			mediaMode = true;

		nodeInserted = node.duration;
		nodeLoaded = node.currentTime;
		updateTitle(node);
	}

	function onProgressHandler(node){
		if(!mediaMode)
			mediaMode = true;

		var current = node.currentTime;
		var duration = node.duration;
		var buffered = node.buffered;
		var max = 0;
		for (var i = 0; i < buffered.length; i++) {
			var e = buffered.end(i);
			var s = buffered.start(i);
			if(current >= s && current <= e){
				max=e;
			}
		}
		nodeInserted = duration;
		nodeLoaded = max;
		updateTitle(node);
	}

	function onUnloadHandler(node){
		mediaMode = false;
		nodeInserted=20;
		nodeLoaded=20;
		updateTitle(node,100);
	}

	function onLoadHandler(node){
		nodeLoaded++;
		updateTitle(node);
	}

	function onErrorHandler(node){
		onLoadHandler(node);
	}

	function setTimeoutTimer(node){
		setTimeout(function(){
			nodeLoaded = nodeInserted;
			updateTitle(node);
		}, 5000);
	}

	let observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {

				if (node.nodeName == "TITLE"){

					if (node.text != docTitle){
						appTitle = node.text;
					}
					updateTitle(node);

					var titleObserver =
						new MutationObserver((m) => {
							// If it is not our update
							var n = m[0].addedNodes[0];
							// If the last char of the new title is '%'. This means
							// this update is coming from our script. Thus, ignore it.
							if (n.textContent != docTitle &&
								n.textContent.slice(-1) != "%"){
								appTitle = n.textContent;
								updateTitle(n);
								setTimeoutTimer(n);
							}
						});
					titleObserver.observe (node , {childList: true,
												   attributes: true});
					setTimeoutTimer(node);
				} else if (node.nodeName == "BODY") {
					nodeInserted++;
					updateTitle(node);
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
					updateTitle(node);
					node.addEventListener("load", () => onLoadHandler(node),
										  listenerConfig);
					node.addEventListener("abort", () => onUnloadHandler(node),
										  listenerConfig);
					node.addEventListener("error", () => onUnloadHandler(node),
										  listenerConfig);
					node.addEventListener("timeupdate", () => onTimeUpdateHandler(node),
										  {"passive": true});
				}
			});
		});
	});

	nodeInserted++;
	updateTitle(window);

	observer.observe(document, {childList: true, subtree: true});
	window.addEventListener( "load",
							 (window) => onLoadHandler(window), listenerConfig);
})();

