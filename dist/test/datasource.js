'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.GenericDatasource = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GenericDatasource = exports.GenericDatasource = function () {
	function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
		_classCallCheck(this, GenericDatasource);

		this.type = instanceSettings.type;
		this.url = instanceSettings.url;
		this.name = instanceSettings.name;
		this.q = $q;
		this.backendSrv = backendSrv;
		this.templateSrv = templateSrv;
		this.headers = { 'Content-Type': 'application/json' };
		if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
			this.headers['Authorization'] = instanceSettings.basicAuth;
		}
	}

	_createClass(GenericDatasource, [{
		key: 'query',
		value: function query(options) {
			var targets = options.targets;

			if (!(targets instanceof Array) || targets.length <= 0) {
				return this.q.when({ data: [] });
			}

			var url = '/kylin/api/query';

			var query = {
				sql: 'select hour_start,count(*) from db_channel.channel group by hour_start',
				limit: 1000,
				offset: 0,
				project: 'streaming',
				acceptPartial: true
			};
			var iterablePromise = [];

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = targets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var target = _step.value;


					var queryData = {
						sql: target.sql,
						limit: target.limit,
						offset: target.offset,
						project: target.project,
						acceptPartial: target.acceptPartial
					};

					iterablePromise.push(this.getPromise(url, queryData));
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			return Promise.all(iterablePromise).then(function (results) {

				if (!results || results.length <= 0) {
					return [];
				}

				var renderedData = [];

				for (var i = 0; i < results.length; i++) {

					var result = results[i];
					var dataPointArray = [];
					var res = result.data.results;

					var _iteratorNormalCompletion2 = true;
					var _didIteratorError2 = false;
					var _iteratorError2 = undefined;

					try {
						for (var _iterator2 = res[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
							var iRes = _step2.value;

							dataPointArray.push([parseInt(iRes[1], 10), new Date(iRes[0]).getTime()]);
						}
					} catch (err) {
						_didIteratorError2 = true;
						_iteratorError2 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion2 && _iterator2.return) {
								_iterator2.return();
							}
						} finally {
							if (_didIteratorError2) {
								throw _iteratorError2;
							}
						}
					}

					renderedData.push({
						datapoints: dataPointArray,
						target: targets[i].target
					});
				}

				return { data: renderedData };
			}).catch(function (reason) {
				console.log(reason);
			});
		}
	}, {
		key: 'getPromise',
		value: function getPromise(url, query) {
			return this.backendSrv.datasourceRequest({
				url: this.url + url,
				data: query,
				method: 'POST',
				headers: this.headers
			});
		}
	}, {
		key: 'testDatasource',
		value: function testDatasource() {
			return this.backendSrv.datasourceRequest({
				url: this.url + '/kylin/api/user/authentication',
				method: 'GET',
				headers: this.headers
			}).then(function (response) {
				if (response.status === 200) {
					return { status: "success", message: "Data source is working", title: "Success" };
				}
			});
		}

		// annotationQuery(options) {
		// 	console.log('annotation query', options);
		// 	debugger;
		// 	var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
		// 	var annotationQuery = {
		// 		range: options.range,
		// 		annotation: {
		// 			name: options.annotation.name,
		// 			datasource: options.annotation.datasource,
		// 			enable: options.annotation.enable,
		// 			iconColor: options.annotation.iconColor,
		// 			query: query
		// 		},
		// 		rangeRaw: options.rangeRaw
		// 	};
		//
		// 	return this.backendSrv.datasourceRequest({
		// 		url: this.url + '/annotations',
		// 		method: 'POST',
		// 		headers: this.headers,
		// 		data: annotationQuery
		// 	}).then(result => {
		// 		return result.data;
		// 	});
		// }

	}, {
		key: 'metricFindQuery',
		value: function metricFindQuery(options) {
			console.log('metricFindQuery', options);

			var target = typeof options === "string" ? options : options.target;
			var interpolated = {
				target: this.templateSrv.replace(target, null, 'regex')
			};

			return this.backendSrv.datasourceRequest({
				url: this.url + '/search',
				data: interpolated,
				method: 'POST',
				headers: this.headers
			}).then(this.mapToTextValue);
		}
	}, {
		key: 'mapToTextValue',
		value: function mapToTextValue(result) {
			console.log('mapToTextValue', result);

			return _lodash2.default.map(result.data, function (d, i) {
				if (d && d.text && d.value) {
					return { text: d.text, value: d.value };
				} else if (_lodash2.default.isObject(d)) {
					return { text: d, value: i };
				}
				return { text: d, value: d };
			});
		}

		// buildQueryParameters(options) {
		// 	//remove placeholder targets
		// 	console.log('buildQueryParameters', options);
		// 	debugger;
		//
		// 	options.targets = _.filter(options.targets, target => {
		// 		return target.target !== 'select metric';
		// 	});
		//
		// 	var targets = _.map(options.targets, target => {
		// 		return {
		// 			target: this.templateSrv.replace(target.target),
		// 			refId: target.refId,
		// 			hide: target.hide,
		// 			type: target.type || 'timeserie'
		// 		};
		// 	});
		//
		// 	options.targets = targets;
		//
		// 	return options;
		// }

	}]);

	return GenericDatasource;
}();
//# sourceMappingURL=datasource.js.map
