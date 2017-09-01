(function($) {
	// Settings
	var repeat = localStorage.repeat || 0,
		shuffle = localStorage.shuffle || 'false',
		continous = true,
		autoplay = true,
		playlist = [{
			mp3: 'mp3/Robin Schulz-Sugar.mp3',
		}, {
			mp3: 'mp3/DJ Snake-Turn Down For What.mp3',
		}, {
			mp3: 'mp3/Deorro-Five Hours.mp3',
		},{
			mp3: 'mp3/Alok-Hear Me Now.mp3',
		},{
			mp3: 'mp3/Avicii-Lay Me Down (Avicii By Avicii).mp3',
		},{
			mp3: 'mp3/Chris Medina-What Are Words.mp3',
		},{
			mp3: 'mp3/Redfoo-Party Train (Explicit).mp3',
		},{
			mp3: 'mp3/Jason Derulo-Talk Dirty.mp3',
		},{
			mp3: 'mp3/Redfoo-Ill Award You With My Body.mp3',
		},{
			mp3: 'mp3/周笔畅-Fascination.mp3',
		}, ];

	// Load playlist
	for(var i = 0; i < playlist.length; i++) {
		var item = playlist[i];
		$('#playlist').append('<li>' + item.artist + ' - ' + item.title + '</li>');
	}

	var time = new Date(),
		currentTrack = shuffle === 'true' ? time.getTime() % playlist.length : 0,
		trigger = false,
		audio, timeout, isPlaying, playCounts;

	var play = function() {
		audio.play();
		$('.playback').addClass('playing');
		timeout = setInterval(updateProgress, 500);
		isPlaying = true;
	}

	var pause = function() {
		audio.pause();
		$('.playback').removeClass('playing');
		clearInterval(updateProgress);
		isPlaying = false;

	}

	// 更新的进展
	var setProgress = function(value) {
		var currentSec = parseInt(value % 60) < 10 ? '0' + parseInt(value % 60) : parseInt(value % 60),
			ratio = value / audio.duration * 100;

		$('.timer').html(parseInt(value / 60) + ':' + currentSec);
		$('.progress .pace').css('width', ratio + '%');
		$('.progress .slider a').css('left', ratio + '%');
	}

	var updateProgress = function() {
		setProgress(audio.currentTime);
	}

	// 进度滑块
	$('.progress .slider').slider({
		step: 0.1,
		slide: function(event, ui) {
			$(this).addClass('enable');
			setProgress(audio.duration * ui.value / 100);
			clearInterval(timeout);
		},
		stop: function(event, ui) {
			audio.currentTime = audio.duration * ui.value / 100;
			$(this).removeClass('enable');
			timeout = setInterval(updateProgress, 500);
		}
	});

	// 音量滑块
	var setVolume = function(value) {
		audio.volume = localStorage.volume = value;
		$('.volume .pace').css('width', value * 100 + '%');
		$('.volume .slider a').css('left', value * 100 + '%');
	}

	var volume = localStorage.volume || 0.5;
	$('.volume .slider').slider({
		max: 1,
		min: 0,
		step: 0.01,
		value: volume,
		slide: function(event, ui) {
			setVolume(ui.value);
			$(this).addClass('enable');
			$('.mute').removeClass('enable');
		},
		stop: function() {
			$(this).removeClass('enable');
		}
	}).children('.pace').css('width', volume * 100 + '%');

	$('.mute').click(function() {
		if($(this).hasClass('enable')) {
			setVolume($(this).data('volume'));
			$(this).removeClass('enable');
		} else {
			$(this).data('volume', audio.volume).addClass('enable');
			setVolume(0);
		}
	});

	// 开关跟踪
	var switchTrack = function(i) {
		if(i < 0) {
			track = currentTrack = playlist.length - 1;
		} else if(i >= playlist.length) {
			track = currentTrack = 0;
		} else {
			track = i;
		}

		$('audio').remove();
		loadMusic(track);
		window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
			var ctx = new AudioContext();
			var analyser = ctx.createAnalyser();
			var audioSrc = ctx.createMediaElementSource(audio);
			audioSrc.connect(analyser);
			analyser.connect(ctx.destination);
			var frequencyData = new Uint8Array(analyser.frequencyBinCount);
			var cvs = document.getElementById('cvs');
			cvs.width = 1700;
			cvs.height = 500;
			var cwidth = cvs.width,
				cheight = cvs.height,
				meterWidth = 5, //柱宽
				gap = 30, //柱间距
				capHeight = 10, //顶子的高度
				capStyle = '#fff',
				meterNum = 1500 / 10, //count of the meters
				capYPositionArray = []; ////存储上限preivous框架的垂直位置
			ctx = cvs.getContext('2d');
			// 循环
			function renderFrame() {
				var array = new Uint8Array(analyser.frequencyBinCount);
				analyser.getByteFrequencyData(array);
				var step = Math.round(array.length / meterNum); //样本数据有限的数组
				ctx.clearRect(0, 0, cwidth, cheight);
				for(var i = 0; i < meterNum; i++) {
					var value = array[i * step];
					if(capYPositionArray.length < Math.round(meterNum)) {
						capYPositionArray.push(value);
					};
					ctx.fillStyle = capStyle;
					//画出帽,过渡效果
					if(value < capYPositionArray[i]) {
						ctx.fillRect(i * (meterWidth + gap), cheight - (--capYPositionArray[i]), meterWidth, capHeight);
					} else {
						ctx.fillRect(i * (meterWidth + gap), cheight - value, meterWidth, capHeight);
						capYPositionArray[i] = value;
					};
					ctx.fillStyle = '#90c400'; //set the filllStyle to gradient for a better look
					ctx.fillRect(i * (meterWidth + gap), cheight - value + capHeight, meterWidth, cheight); //the meter
				}
				requestAnimationFrame(renderFrame);
			}
			renderFrame();
		if(isPlaying == true) play();
	}

	// 洗牌
	var shufflePlay = function() {
		var time = new Date(),
			lastTrack = currentTrack;
		currentTrack = time.getTime() % playlist.length;
		if(lastTrack == currentTrack) ++currentTrack;
		switchTrack(currentTrack);
	}

	// 火跟踪结束时
	var ended = function() {
		pause();
		audio.currentTime = 0;
		playCounts++;
		if(continous == true) isPlaying = true;
		if(repeat == 1) {
			play();
		} else {
			if(shuffle === 'true') {
				shufflePlay();
			} else {
				if(repeat == 2) {
					switchTrack(++currentTrack);
				} else {
					if(currentTrack < playlist.length) switchTrack(++currentTrack);
				}
			}
		}
	}

	var beforeLoad = function() {
		var endVal = this.seekable && this.seekable.length ? this.seekable.end(0) : 0;
		$('.progress .loaded').css('width', (100 / (this.duration || 1) * endVal) + '%');
	}

	// 火完全跟踪加载时
	var afterLoad = function() {
		if(autoplay == true) play();
	}

	// 负荷跟踪
	var loadMusic = function(i) {
		var item = playlist[i],
			newaudio = $('<audio>').html('<source src="' + item.mp3 + '"><source src="' + item.ogg + '">').appendTo('#player');

		$('.cover').html('<img src="' + item.cover + '" alt="' + item.album + '">');
		$('.tag').html('<strong>' + item.title + '</strong><span class="artist">' + item.artist + '</span><span class="album">' + item.album + '</span>');
		$('#playlist li').removeClass('playing').eq(i).addClass('playing');
		audio = newaudio[0];
		audio.volume = $('.mute').hasClass('enable') ? 0 : volume;
		audio.addEventListener('progress', beforeLoad, false);
		audio.addEventListener('durationchange', beforeLoad, false);
		audio.addEventListener('canplay', afterLoad, false);
		audio.addEventListener('ended', ended, false);
	}

	loadMusic(currentTrack);
	$('.playback').on('click', function() {
		if($(this).hasClass('playing')) {
			pause();
		} else {
			play();
		}
	});
	$('.rewind').on('click', function() {
		if(shuffle === 'true') {
			shufflePlay();
		} else {
			switchTrack(--currentTrack);
		}
	});
	$('.fastforward').on('click', function() {
		if(shuffle === 'true') {
			shufflePlay();
		} else {
			switchTrack(++currentTrack);
		}
	});
	$('#playlist li').each(function(i) {
		var _i = i;
		$(this).on('click', function() {
			switchTrack(_i);
		});
	});

	if(shuffle === 'true') $('.shuffle').addClass('enable');
	if(repeat == 1) {
		$('.repeat').addClass('once');
	} else if(repeat == 2) {
		$('.repeat').addClass('all');
	}

	$('.repeat').on('click', function() {
		if($(this).hasClass('once')) {
			repeat = localStorage.repeat = 2;
			$(this).removeClass('once').addClass('all');
		} else if($(this).hasClass('all')) {
			repeat = localStorage.repeat = 0;
			$(this).removeClass('all');
		} else {
			repeat = localStorage.repeat = 1;
			$(this).addClass('once');
		}
	});

	$('.shuffle').on('click', function() {
		if($(this).hasClass('enable')) {
			shuffle = localStorage.shuffle = 'false';
			$(this).removeClass('enable');
		} else {
			shuffle = localStorage.shuffle = 'true';
			$(this).addClass('enable');
		}
	});

	window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
	if(typeof window.AudioContext != 'undefined') {

		var ctx = new AudioContext();
		var analyser = ctx.createAnalyser();
		var audioSrc = ctx.createMediaElementSource(audio);
		audioSrc.connect(analyser);
		analyser.connect(ctx.destination);
		var frequencyData = new Uint8Array(analyser.frequencyBinCount);
		var cvs = document.getElementById('cvs');
		cvs.width = 1700;
		cvs.height = 500;
		var cwidth = cvs.width,
			cheight = cvs.height,
			meterWidth = 5, //柱宽
			gap = 30, //柱间距
			capHeight = 10, //顶子的高度
			capStyle = '#fff',
			meterNum = 1500 / 10, //count of the meters
			capYPositionArray = []; ////存储上限preivous框架的垂直位置
		ctx = cvs.getContext('2d');
		// loop
		function renderFrame() {
			var array = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteFrequencyData(array);
			var step = Math.round(array.length / meterNum); //样本数据有限的数组
			ctx.clearRect(0, 0, cwidth, cheight);
			for(var i = 0; i < meterNum; i++) {
				var value = array[i * step];
				if(capYPositionArray.length < Math.round(meterNum)) {
					capYPositionArray.push(value);
				};
				ctx.fillStyle = capStyle;
				//画出帽,过渡效果
				if(value < capYPositionArray[i]) {
					ctx.fillRect(i * (meterWidth + gap), cheight - (--capYPositionArray[i]), meterWidth, capHeight);
				} else {
					ctx.fillRect(i * (meterWidth + gap), cheight - value, meterWidth, capHeight);
					capYPositionArray[i] = value;
				};
				ctx.fillStyle = '#90c400'; //set the filllStyle to gradient for a better look
				ctx.fillRect(i * (meterWidth + gap), cheight - value + capHeight, meterWidth, cheight); //the meter
			}
			requestAnimationFrame(renderFrame);
		}

		renderFrame();
	}

})(jQuery);