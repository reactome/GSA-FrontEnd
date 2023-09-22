import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Store} from "@ngrx/store";
import {Method} from "../state/method/method.state";
import {methodActions} from "../state/method/method.action";
import {paramTracker} from "../utilities/method-parameter/method-parameter.component";
import {Parameter} from "../model/parameter.model";

@Component({
  selector: 'gsa-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss']
})
export class OptionsComponent implements OnInit {
  @Input() method: Method;
  analysisOptionsStep: FormGroup;

  parameters: Parameter[];

  constructor(private formBuilder: FormBuilder, public store: Store) {
    this.analysisOptionsStep = this.formBuilder.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.parameters = this.method.parameters.filter(p => p.scope === 'common')
  }

  updateParam(param: Parameter) {
    this.store.dispatch(methodActions.updateSelectedParam({param}));
  }

  protected readonly paramTracker = paramTracker;
}
