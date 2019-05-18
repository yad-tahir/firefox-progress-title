(function() {
	'use strict';

	var docTitle = document.title;
	var appTitle = docTitle
	var lastProgress = 0;
	var nodeLoaded = 0;
	var nodeInserted = 0;
	var lastTime = 0;
	
	const listenerConfig = {"once": true, "capture": true, "passive": true};

	function updateTitle(node, progress){
		const time = Date.now();
		if (time > lastTime + 100){
			if(typeof progress === "undefined"){
				progress = 100 - (nodeInserted - nodeLoaded) * 100 / nodeInserted;
			}

			if (progress > 100){
				progress = 100;
			}
			if (progress >= 0){
				lastProgress = progress;
				lastTime = time;

				if(appTitle != "" && appTitle != docTitle){
					docTitle = appTitle.concat(" - ", Math.round(progress), "%");
					document.title = docTitle;
				}
			}
			
		}
	}

	function onTimeUpdateHandler(node){
		nodeInserted = node.duration;
		nodeLoaded = node.currentTime;
		updateTitle(node);
	}

	function onProgressHandler(node){
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
		nodeInserted=10;
		nodeLoaded=10;
		updateTitle(node);
	}

	function onLoadHandler(node){
		nodeLoaded++;
		updateTitle(node);
	}

	function onErrorHandler(node){
		onLoadHandler(node);
	}

	let observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {

				if (node.nodeName == "TITLE"){

					if (document.title != docTitle){
						appTitle = document.title;
					}
					updateTitle(node);

					var titleObserver =
						new MutationObserver((m) => {
							// If it is not our update
							if (document.title != docTitle){
								appTitle = document.title;
							}
							updateTitle(m);
						});
					titleObserver.observe (node, {childList: true,
												  attributes: true,
												  subtree: true});
				} else if (node.nodeName == "BODY") {
					nodeInserted++;
					updateTitle(node);
					node.addEventListener( "load",
										   () => onLoadHandler(node),
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
					node.addEventListener("load",
										  () => onLoadHandler(node),
										  listenerConfig);
					node.addEventListener("error",
										  () => onErrorHandler(node),
										  listenerConfig);
					node.addEventListener("abort",
										  () => onErrorHandler(node),
										  listenerConfig);
				} else if (node.nodeName == "VIDEO" ||
						   node.nodeName == "AUDIO"){
					
					nodeInserted++;
					updateTitle(node);
					node.addEventListener("load",
										  () => onLoadHandler(node),
										  listenerConfig);
					node.addEventListener("abort",
										  () => onUnloadHandler(node),
										  listenerConfig);
					node.addEventListener("error",
										  () => onUnloadHandler(node),
										  listenerConfig);
					node.addEventListener("timeupdate",
										  () => onTimeUpdateHandler(node),
										  {"passive": true});
				}

			});
		});
	});

	nodeInserted++;
	updateTitle(window);

	observer.observe(document, {childList: true, subtree: true});
	window.addEventListener( "load", (window) => {
		onLoadHandler(window);

		setTimeout((node) => {
			nodeLoaded = nodeInserted;
			updateTitle(node);
		}, 2000);

	}, listenerConfig);
})();

