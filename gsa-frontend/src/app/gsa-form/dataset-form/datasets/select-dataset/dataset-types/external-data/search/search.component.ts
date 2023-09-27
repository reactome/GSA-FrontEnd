import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Store} from "@ngrx/store";
import {Observable} from "rxjs";
import {searchResultFeature} from "../../../../../../state/search-result/search-result.selector";
import {SearchResult} from "../../../../../../state/search-result/search-result.state";
import {searchResultActions} from "../../../../../../state/search-result/search-result.action";
import {datasetActions} from "../../../../../../state/dataset/dataset.actions";

@Component({
  selector: 'gsa-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, AfterViewInit {

  @Input() datasetId: number;

  searchForm = new FormGroup({
    species: new FormControl(''),
    keywords: new FormControl('')
  })

  firstQuery = true;
  species$: Observable<string[]> = this.store.select(searchResultFeature.selectSpeciesList);
  results$: Observable<SearchResult[]> = this.store.select(searchResultFeature.selectAll);

  constructor(private store: Store) {

  }

  ngOnInit(): void {
    this.store.dispatch(searchResultActions.loadSpecies());

  }

  ngAfterViewInit(): void {
    this.searchForm.controls['keywords'].addValidators([Validators.required])
  }

  search() {
    this.store.dispatch(searchResultActions.search({
      species: this.searchForm.value.species,
      keywords: this.searchForm.value.keywords as string
    }))
    this.firstQuery = false;
  }

  select(result: SearchResult): void {
    this.store.dispatch(datasetActions.load({
      id: this.datasetId, resourceId: result.resource_loading_id, parameters: result.loading_parameters
    }))
  }

}