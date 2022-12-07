import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AnalysisMethodsService} from "../services/analysis-methods.service";
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {UntilDestroy, untilDestroyed} from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
  selector: 'gsa-analysis-methods',
  templateUrl: './analysis-methods.component.html',
  styleUrls: ['./analysis-methods.component.scss']
})
export class AnalysisMethodsComponent implements OnInit {

  analysisMethodStep: FormGroup;
  screenIsXSmall: boolean = false;
  @ViewChild('flyingRename') input: ElementRef<HTMLInputElement>;

  constructor(private formBuilder: FormBuilder, public analysisMethodsService: AnalysisMethodsService, private responsive: BreakpointObserver) {
    this.analysisMethodStep = this.formBuilder.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.analysisMethodsService.getAnalysisMethods();
    this.responsive.observe(Breakpoints.XSmall)
      .pipe(untilDestroyed(this))
      .subscribe(result => this.screenIsXSmall = result.matches);
  }

  // @ViewChild('root') rootRef: ElementRef<HTMLDivElement>;
  // settings: Settings
  // columns: string[] = [
  //   "cell.type",
  //   "cell.group",
  // ]
  // rows: string[] = [
  //   "cluster 1",
  //   "cluster 2",
  //   "cluster 3",
  //   "cluster 4",
  //   "cluster 5",
  //   "cluster 6",
  //   "cluster 7",
  //   "cluster 8",
  //   "cluster 9",
  //   "cluster 10",
  //   "cluster 11",
  //   "cluster 12",
  //   "cluster 13"
  // ]
  // dataset: CellInfo[][] = [
  //   [new CellInfo("Memory 0"), new CellInfo("Normal 0")],
  //   [new CellInfo("Memory 1"), new CellInfo("Normal 1")],
  //   [new CellInfo("Memory 2"), new CellInfo("Normal 2")],
  //   [new CellInfo("Memory 3"), new CellInfo("Normal 3")],
  //   [new CellInfo("Memory 4"), new CellInfo("Normal 4")],
  //   [new CellInfo("Memory 5"), new CellInfo("Normal 5")],
  //   [new CellInfo("Memory 6"), new CellInfo("Normal 6")],
  //   [new CellInfo("Memory 7"), new CellInfo("Normal 7")],
  //   [new CellInfo("Memory 8"), new CellInfo("Normal 8")],
  //   [new CellInfo("Memory 9"), new CellInfo("Normal 9")],
  //   [new CellInfo("Memory 0"), new CellInfo("Normal 0")],
  //   [new CellInfo("Memory 1"), new CellInfo("Normal 1")],
  //   [new CellInfo("Memory 2"), new CellInfo("Normal 2")],
  // ]
  //

  // ngOnInit() {
  //   this.settings = {
  //     columns: this.columns,
  //     rows: this.rows,
  //     data: this.dataset,
  //     renameCols: true,
  //     renameRows: false
  //   }
  // }
  //

}

