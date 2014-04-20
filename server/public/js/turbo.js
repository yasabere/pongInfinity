var turbo = (function () {
	/**** HEPLERS ****/
	var s4 = function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	};
	var guid = function guid() {
		return ((new Date()).getTime()) + '-' + s4() + '-' + s4();
	};

	/************************************* MODEL DEFINITIONS **************************************/

	var TurboClient = function (url) {
		var _this = this;
		_this.url = url;
		_this._$_connectCallbacks = [];
		_this._$_disconnectCallbacks = [];
		_this._$_messageCallbackMap = {};
		// WEB SOCKET HANDLER FUNCTIONS
		this._$_onOpen = function (event) {
			_this.connected = true;
			// Send the connection payload
			_this.ws.send(JSON.stringify({
              	type: 'connect',
				user: _this.userId,
				session: _this.sessionId
			}));
			// Notify everyone
			while (_this._$_connectCallbacks.length > 0) {
				(_this._$_connectCallbacks.pop())(null, event);
			}
		};
		this._$_onClose = function (event) {
			_this.connected = false;
			while (_this._$_disconnectCallbacks.length > 0) {
				(_this._$_disconnectCallbacks.pop())(null, event);
			}
		};
		this._$_onMessage = function (event) {
			var data = JSON.parse(event.data);
			// Check the message type
			var queue;
			if (queue = _this._$_messageCallbackMap[data.type]) {
				queue.forEach(function(cb) {
					cb(data);
				});
			}
		};
		this._$_onError = function (event) {
			console.log('_onError', event);
			while (_this._$_connectCallbacks.length > 0) {
				(_this._$_connectCallbacks.pop())(event);
			}
			while (_this._$_disconnectCallbacks.length > 0) {
				(_this._$_disconnectCallbacks.pop())(event);
			}
		};
	};
	// EXTERNAL FUNCTIONS
	TurboClient.prototype.connect = function (sessionId, userId, callback) {
      var _this = this;
      setTimeout(function() {
		if (!sessionId) throw 'The session id was null';
		if (!userId) throw 'The user id was null';

		_this.sessionId = sessionId;
		_this.userId = userId;

		_this._$_connectCallbacks.push(callback);
		// Create the ws
		_this.ws = new WebSocket(_this.url);
		_this.ws.onopen = _this._$_onOpen;
		_this.ws.onclose = _this._$_onClose;
		_this.ws.onmessage = _this._$_onMessage;
		_this.ws.onerror = _this._$_onError;
      }, 4000);
	};
	TurboClient.prototype.disconnect = function (callback) {
		if (this.ws) {
			this._$_disconnectCallbacks.push(callback);
			// DC the ws
			this.ws.close();
		}
	};
	TurboClient.prototype.on = function (name, cb) {
		if (!name) throw 'The name was null';
		if (!cb) throw 'The callback was null';

		var queue;
		if (queue = this._$_messageCallbackMap[name]) {
		} else {
			queue = this._$_messageCallbackMap[name] = [];
		}
		queue.push(cb);
	};
	TurboClient.prototype.send = function (str) {
		this.ws.send(str);
	};
	
	/************************************* METHOD DEFINITIONS *************************************/

	// Create client generator
	var makeClient = function (opts) {
		if (!opts) opts = {};
		if (typeof opts !== 'object') throw 'The parameter map was not an object';
		// Make the web socket url
		var url = 'ws://' + location.hostname + ':' + (opts.port || 9001) + '/' + ((opts.path) ? opts.path : '');
		// Make the client
		var client = function (context) {
			if (!context) throw 'The context parameter was null';
			return makeDelegate(context, client);
		};
		TurboClient.call(client, url);
		client.connect = TurboClient.prototype.connect;
		client.disconnect = TurboClient.prototype.disconnect;
		client.on = TurboClient.prototype.on;

		return new TurboClient(url);
	};

	return makeClient;
})();