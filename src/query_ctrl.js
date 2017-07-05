import {QueryCtrl} from 'app/plugins/sdk';
import './css/query-editor.css!'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

	constructor($scope, $injector, uiSegmentSrv) {
		super($scope, $injector);
		this.scope = $scope;
		this.uiSegmentSrv = uiSegmentSrv;
		this.target.sql = this.target.sql || 'please write the text of sql statement';
		this.target.offset = this.target.offset || 0;
		this.target.limit = this.target.limit || 50000;
		this.target.project = this.target.project || 'DEFAULT';
		this.target.acceptPartial = this.target.acceptPartial || true;
		this.target.target = this.target.target || 'the name of this sql to show in legend';
	}

	getOptions() {
		debugger;
		return this.datasource.metricFindQuery(this.target)
		.then(this.uiSegmentSrv.transformToSegments(false));
		// Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
	}

	toggleEditorMode() {
		debugger;
		this.target.rawQuery = !this.target.rawQuery;
	}

	onChangeInternal() {
		debugger;
		this.panelCtrl.refresh(); // Asks the panel to refresh data.
	}
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

