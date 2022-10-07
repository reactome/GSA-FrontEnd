import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HttpClientModule} from "@angular/common/http";
import {AnalysisToolsComponent} from "./analysis-tools/analysis-tools.component";
import { HeaderComponent } from './generalUsage/header/header.component';

@NgModule({
  declarations: [
    AppComponent, AnalysisToolsComponent, HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
