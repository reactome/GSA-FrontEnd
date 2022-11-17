import {Component, Input, OnInit} from '@angular/core';
import {ExampleDataset} from "../../../../model/fetch-dataset.model";
import {FetchDatasetService} from "../../../../services/fetch-dataset.service";
import {LoadDatasetService} from "../../../../services/load-dataset.service";
import {AnalysisObject} from "../../../../model/analysisObject.model";

@Component({
  selector: 'gsa-example-data',
  templateUrl: './example-data.component.html',
  styleUrls: ['./example-data.component.scss']
})
export class ExampleDataComponent implements OnInit {
  @Input() analysisObject : AnalysisObject
  @Input() data: ExampleDataset;


  constructor(public dataService: FetchDatasetService, public loadDataService : LoadDatasetService) {
  }

  ngOnInit(): void {
  }

  select() {
    this.dataService.chooseDataset = this.data;
    this.loadData()
  }

  loadData() {
    this.loadDataService.loadDataset('example_datasets', [{
      name: "dataset_id",
      value: this.data.id
    }], this.analysisObject)
  }
}