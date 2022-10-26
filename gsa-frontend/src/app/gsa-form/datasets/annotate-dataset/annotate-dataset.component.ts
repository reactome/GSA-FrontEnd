import {AfterContentInit, AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {LoadDatasetService} from "../../services/load-dataset.service";
import {CellInfo, Settings} from "../../model/table.model";


@Component({
  selector: 'gsa-annotate-dataset',
  templateUrl: './annotate-dataset.component.html',
  styleUrls: ['./annotate-dataset.component.scss']
})
export class AnnotateDatasetComponent implements OnInit, AfterViewInit, AfterContentInit{

  frmStepThree: FormGroup;
  firstSelected: string = ''

  settings: Settings = {

    columns: this.loadDataService.columns,
    rows: this.loadDataService.rows,
    data: this.loadDataService.dataset,
    rename_rows: false
  }


  constructor(private formBuilder: FormBuilder, public loadDataService: LoadDatasetService) {
    this.frmStepThree = this.formBuilder.group({
      address: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    console.log(this.loadDataService.rows)
  }

  ngAfterViewInit() {
    console.log(this.loadDataService.rows)
  }

  ngAfterContentInit() {
    console.log(this.loadDataService.rows)
  }
}

