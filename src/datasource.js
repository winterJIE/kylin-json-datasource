import _ from "lodash";

export class GenericDatasource {

	constructor(instanceSettings, $q, backendSrv, templateSrv) {
		this.type = instanceSettings.type;
		this.url = instanceSettings.url;
		this.name = instanceSettings.name;
		this.q = $q;
		this.backendSrv = backendSrv;
		this.templateSrv = templateSrv;
		this.headers = {'Content-Type': 'application/json'};
		if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
			this.headers['Authorization'] = instanceSettings.basicAuth;
		}
	}

	query(options) {
		const targets = options.targets;

		if (!(targets instanceof Array) || targets.length <= 0) {
			return this.q.when({data: []});
		}

		const url = '/kylin/api/query';

		const query = {
			sql: 'select hour_start,count(*) from db_channel.channel group by hour_start',
			limit: 1000,
			offset: 0,
			project: 'streaming',
			acceptPartial: true
		};
		const iterablePromise = [];

		for (let target of targets) {

			const queryData = {
				sql: target.sql,
				limit: target.limit,
				offset: target.offset,
				project: target.project,
				acceptPartial: target.acceptPartial
			};

			iterablePromise.push(this.getPromise(url, queryData));
		}

		return Promise.all(iterablePromise).then(function (results) {

			if (!results || results.length <= 0) {
				return [];
			}

			const renderedData = [];

			for(let i = 0; i< results.length; i++) {

				const result = results[i];
				const dataPointArray = [];
				const res = result.data.results;

				for (let iRes of res) {
					dataPointArray.push([parseInt(iRes[1], 10), new Date(iRes[0]).getTime()]);
				}

				renderedData.push({
					datapoints: dataPointArray,
					target: targets[i].target
				});
			}

			return {data: renderedData};
		}).catch(reason => {
			console.log(reason)
		});
	}

	getPromise(url, query) {
		return this.backendSrv.datasourceRequest({
			url: this.url + url,
			data: query,
			method: 'POST',
			headers: this.headers
		})
	}

	testDatasource() {
		return this.backendSrv.datasourceRequest({
			url: this.url + '/kylin/api/user/authentication',
			method: 'GET',
			headers: this.headers
		}).then(response => {
			if (response.status === 200) {
				return {status: "success", message: "Data source is working", title: "Success"};
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

	metricFindQuery(options) {
		console.log('metricFindQuery', options);

		const target = typeof (options) === "string" ? options : options.target;
		const interpolated = {
			target: this.templateSrv.replace(target, null, 'regex')
		};

		return this.backendSrv.datasourceRequest({
			url: this.url + '/search',
			data: interpolated,
			method: 'POST',
			headers: this.headers
		}).then(this.mapToTextValue);
	}

	mapToTextValue(result) {
		console.log('mapToTextValue', result);

		return _.map(result.data, (d, i) => {
			if (d && d.text && d.value) {
				return {text: d.text, value: d.value};
			} else if (_.isObject(d)) {
				return {text: d, value: i};
			}
			return {text: d, value: d};
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
}
