import {AfterViewInit, ChangeDetectorRef, Component, Input, ViewChild} from '@angular/core';
import {SelectDatasetComponent} from "../../datasets/select-dataset/select-dataset.component";
import {AnnotateDatasetComponent} from "../../datasets/annotate-dataset/annotate-dataset.component";
import {StatisticalDesignComponent} from "../../datasets/statistical-design/statistical-design.component";
import {AnalysisService} from "../../services/analysis.service";
import {LoadDatasetService} from "../../services/load-dataset.service";
import {MatStepper} from "@angular/material/stepper";
import {Dataset} from "../../model/dataset.model";
import {MatDialog} from "@angular/material/dialog";
import {ChangeAnalysisParamsComponent} from "../../datasets/change-analysis-params/change-analysis-params.component";

@Component({
  selector: 'gsa-nested-stepper',
  templateUrl: './nested-stepper.component.html',
  styleUrls: ['./nested-stepper.component.scss']
})
export class NestedStepperComponent implements AfterViewInit {

  @ViewChild('nestedStepper') public stepper: MatStepper;
  @ViewChild('selectData') selectDatasetComponent: SelectDatasetComponent;
  @ViewChild('annotateData') annotateDatasetComponent: AnnotateDatasetComponent;
  @ViewChild("statisticalDesign") statisticalDesignComponent: StatisticalDesignComponent
  @Input() dataset: Dataset;

  constructor(public loadDatasetService: LoadDatasetService, private cdr: ChangeDetectorRef, public analysisService: AnalysisService, public dialog: MatDialog) {
  }


  ngAfterViewInit() {
    this.cdr.detectChanges();
    this.loadDatasetService.stepper = this.stepper;
  }


  deleteDataset() {
    let indexdataset = this.analysisService.datasets.indexOf(this.dataset);
    this.analysisService.datasets.splice(indexdataset, 1);
  }


  setValidStatisticalDesign() {
    if (this.dataset.statisticalDesign?.analysisGroup !== undefined) {
      if (this.dataset.table?.columns.indexOf(this.dataset.statisticalDesign!.analysisGroup) === -1) {
        this.dataset.statisticalDesign!.analysisGroup = undefined;
      }
    }
  }

  saveData() {
    this.dataset.saved = true;
  }


  checkStatisticalDesign(): boolean {
    return this.dataset.statisticalDesign?.analysisGroup !== undefined &&
      this.dataset.statisticalDesign?.comparisonGroup1 !== undefined &&
      this.dataset.statisticalDesign?.comparisonGroup2 !== undefined;

  }

  changeParameters($event: MouseEvent) {
    $event.stopImmediatePropagation()
    this.dialog.open(ChangeAnalysisParamsComponent, {
      data: {dataset: this.dataset},
    });
  }

}
