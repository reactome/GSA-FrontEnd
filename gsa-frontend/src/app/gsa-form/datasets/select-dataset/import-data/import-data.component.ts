import {Component, Input, OnInit} from '@angular/core';
import {ExampleDataset, ImportDataset} from "../../../model/fetch-dataset.model";
import {FetchDatasetService} from "../../../services/fetch-dataset.service";
import {LoadDatasetService} from "../../../services/load-dataset.service";
import {LoadParameter, LoadParameterClass} from "../../../model/load-dataset.model";

@Component({
  selector: 'gsa-import-data',
  templateUrl: './import-data.component.html',
  styleUrls: ['./import-data.component.scss']
})
export class ImportDataComponent implements OnInit {
  @Input() data: ImportDataset;

  constructor(public dataService: FetchDatasetService, public loadDataService : LoadDatasetService) {
  }

  ngOnInit(): void {
  }

  select():void {
    this.dataService.chooseDataset = this.data;
  }

  doNothing() :void{
  }

  loadData() : void{
    let loadParams : LoadParameter[] =[]
    for (let param in this.data.parameters) {
      loadParams[param] = new LoadParameterClass(this.data.parameters[param].name, this.data.parameters[param].value.toString())
    }
    this.loadDataService.loadDataset(this.data.id, loadParams)
  }
}


