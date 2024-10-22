import {Component, Input} from '@angular/core';
import {PDatasetSource} from "../../../../../state/dataset-source/dataset-source.state";
import {datasetSourceActions} from "../../../../../state/dataset-source/dataset-source.action";
import {Store} from "@ngrx/store";
import {datasetActions} from "../../../../../state/dataset/dataset.actions";

@Component({
  selector: 'gsa-local-data',
  templateUrl: './local-data.component.html',
  styleUrls: ['./local-data.component.scss']
})
export class LocalDataComponent {
  @Input() source: PDatasetSource;
  @Input() datasetId: number;

  showPopup: boolean = false;
  loadLocalFiles: boolean = true;
  filesLoaded: boolean = false;
  fileRibo: File | null = null;
  fileRNA: File | null = null;


  rnaFileName: string | null = null;
  riboFileName: string | null = null;


  fileMatching: boolean = true;
  fileValid: boolean = true;

  constructor(public store: Store) {
  }

  select() {
    this.store.dispatch(datasetSourceActions.select({toBeSelected: this.source}));
  }

  onFileSelected(event: any) {
    if (this.isRiboSeq()) {
      this.showPopup = true;
      this.loadLocalFiles = false;
    } else {
      const file: File = event.target.files[0];
      if (file) {
        this.store.dispatch(datasetActions.upload({id: this.datasetId, file, typeId: this.source.id}));
      }
    }
  }

  async uploadRiboData() {
    if (this.fileRibo && this.fileRNA) {
      let fileRNA_ = this.fileRNA
      let fileRibo_ = this.fileRibo
      this.store.dispatch(datasetActions.uploadRibo({id: this.datasetId, fileRibo: fileRibo_, fileRNA: fileRNA_,typeId: this.source.id}))
    }
  }

  isRiboSeq(): boolean {
    return this.source.name === 'Ribo-seq';
  }

  closePopUp() {
    this.showPopup = false;
    this.filesLoaded = false;
  }

  async uploadRNAFile(event: any) {
    this.fileRNA = event.target.files[0];
    if (this.fileRNA) {
      this.fileValid = await this.checkValidFile(this.fileRNA);
      this.rnaFileName = this.fileRNA.name
    }

    if (this.fileRibo && this.fileRNA) {
       this.filesLoaded = true;
       this.fileMatching = await this.checkFirstLinesMatch(this.fileRNA, this.fileRibo);
    }
  }

  async uploadRiboFile(event: any) {
    this.fileRibo = event.target.files[0];
    if (this.fileRibo) {
       this.fileValid = await this.checkValidFile(this.fileRibo);
       this.riboFileName = this.fileRibo.name
    }
    if (this.fileRibo && this.fileRNA) {
       this.filesLoaded = true;
       this.fileMatching = await this.checkFirstLinesMatch(this.fileRNA, this.fileRibo);
    }
  }

  // Drag-and-Drop Handlers

  onDragOver(event: DragEvent) {
    event.preventDefault();
    const dropZone = (event.target as HTMLElement).closest('.drop-zone');
    if (dropZone) {
      dropZone.classList.add('drag-over');
    }
  }

  onDragLeave(event: DragEvent) {
    const dropZone = (event.target as HTMLElement).closest('.drop-zone');
    if (dropZone) {
      dropZone.classList.remove('drag-over');
    }
  }

  async onRNADrop(event: DragEvent) {
    event.preventDefault();
    this.onDragLeave(event); // Remove the drag-over style
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.uploadRNAFile({target: {files}});
    }
  }

  async onRiboDrop(event: DragEvent) {
    event.preventDefault();
    this.onDragLeave(event); // Remove the drag-over style
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadRiboFile({target: {files}});
    }
  }

  async checkValidFile(file: File): Promise<boolean> {
    if (file === null) return false
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function (event) {
        const text = event.target?.result as string;
        if (!text) {
          return resolve(false);
        }
        const lines = text.trim().split('\n');

        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split('\t');
          for (let j = 1; j < columns.length; j++) {
            const value = columns[j].trim();
            if (!Number.isInteger(Number(value))) {
              return resolve(false);
            }
          }
        }
        resolve(true);
      };
      reader.onerror = function () {
        reject(new Error("Failed to read the file"));
      };
      reader.readAsText(file);
    });
  }

  async checkFirstLinesMatch(fileRNA: File, fileRibo: File): Promise<boolean> {
    try {
      const [file1Content, file2Content] = await Promise.all([
        this.readFile(fileRNA),
        this.readFile(fileRibo)
      ]);

      const file1FirstLine = file1Content.split('\n')[0].trim();
      const file2FirstLine = file2Content.split('\n')[0].trim();

      return file1FirstLine === file2FirstLine;
    } catch (error) {
      return false;
    }
  }

  readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }
}
