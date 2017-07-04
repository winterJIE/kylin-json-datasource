'use strict';

System.register(['lodash'], function (_export, _context) {
	"use strict";

	var _, _createClass, GenericDatasource;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [function (_lodash) {
			_ = _lodash.default;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			_export('GenericDatasource', GenericDatasource = function () {
				function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
					_classCallCheck(this, GenericDatasource);

					console.log(arguments);
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
						console.log('query options', options);
						// var query = this.buildQueryParameters(options);
						// query.targets = query.targets.filter(t => !t.hide);
						//
						// if (query.targets.length <= 0) {
						// 	return this.q.when({data: []});
						// }

						var query = {
							sql: 'select hour_start,count(*) from db_channel.channel group by hour_start',
							limit: 1000,
							offset: 0,
							project: 'streaming',
							acceptPartial: true
						};
						var target = options.target;
						if (target instanceof Array && target.length > 0) {
							query = target[0];
						}

						console.log('query data', query);
						var result = this.backendSrv.datasourceRequest({
							url: this.url + '/kylin/api/query',
							data: query,
							method: 'POST',
							headers: this.headers
						});
						console.log('result', result);
						return result;
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
				}, {
					key: 'annotationQuery',
					value: function annotationQuery(options) {
						console.log('annotation query', options);
						debugger;
						var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
						var annotationQuery = {
							range: options.range,
							annotation: {
								name: options.annotation.name,
								datasource: options.annotation.datasource,
								enable: options.annotation.enable,
								iconColor: options.annotation.iconColor,
								query: query
							},
							rangeRaw: options.rangeRaw
						};

						return this.backendSrv.datasourceRequest({
							url: this.url + '/annotations',
							method: 'POST',
							headers: this.headers,
							data: annotationQuery
						}).then(function (result) {
							return result.data;
						});
					}
				}, {
					key: 'metricFindQuery',
					value: function metricFindQuery(options) {
						console.log('metricFindQuery', options);
						debugger;

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
						debugger;

						return _.map(result.data, function (d, i) {
							if (d && d.text && d.value) {
								return { text: d.text, value: d.value };
							} else if (_.isObject(d)) {
								return { text: d, value: i };
							}
							return { text: d, value: d };
						});
					}
				}, {
					key: 'buildQueryParameters',
					value: function buildQueryParameters(options) {
						var _this = this;

						//remove placeholder targets
						console.log('buildQueryParameters', options);
						debugger;

						options.targets = _.filter(options.targets, function (target) {
							return target.target !== 'select metric';
						});

						var targets = _.map(options.targets, function (target) {
							return {
								target: _this.templateSrv.replace(target.target),
								refId: target.refId,
								hide: target.hide,
								type: target.type || 'timeserie'
							};
						});

						options.targets = targets;

						return options;
					}
				}]);

				return GenericDatasource;
			}());

			_export('GenericDatasource', GenericDatasource);
		}
	};
});
//# sourceMappingURL=datasource.js.map
