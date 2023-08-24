import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Settings} from "../../model/table.model";
import {Clipboard} from '@angular/cdk/clipboard';
import {MatButton} from "@angular/material/button";
import {Cell, Coords, TableStore} from "./state/table.store";
import {combineLatest, delay, filter, first, map, Observable, tap} from "rxjs";
import {isDefined} from "../utils";
import {Subset} from "../../model/utils.model";
import {UntilDestroy, untilDestroyed} from "@ngneat/until-destroy";


type CellCoord = { x: number, y: number, parentElement: any };

export type Mapper<T> = {
  [p: string | number]: T
}

interface SelectedCellRange {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

type Direction = "up" | "down" | "left" | "right";
/**
 * [x,y]
 */
type Coord = [number, number];
type Range = { start: Coord, stop?: Coord };

@UntilDestroy()
@Component({
  selector: 'gsa-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  providers: [TableStore]
})
export class TableComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('flyingRename') input: ElementRef<HTMLInputElement>;
  @ViewChild('root') rootRef: ElementRef<HTMLDivElement>;
  @ViewChild('corner') cornerRef: ElementRef<HTMLTableCellElement>;
  cornerRect?: DOMRect;
  @ViewChild('addCol') columnButton: MatButton;
  isDragging: boolean = false;

  @Input() userSettings: Subset<Settings>;
  @Input() table: string[][];
  @Output() tableChange: EventEmitter<string[][]> = new EventEmitter<string[][]>();

  start$: Observable<Coords>;
  startCell$: Observable<HTMLTableCellElement>;
  startClasses$: Observable<Mapper<boolean>>;
  startCoords$: Observable<DOMRect>;
  stop$: Observable<Coords>;
  startType$: Observable<'row' | 'col' | 'cell'>;
  inputLevel$: Observable<number>;
  isCell$: Observable<boolean>;
  inputValue$: Observable<string>;
  data$: Observable<Cell[][]>;
  settings$: Observable<Settings>;
  value: string;


  constructor(private clipboard: Clipboard, private cd: ChangeDetectorRef, public readonly tableStore: TableStore) {
  }

  ngOnInit(): void {
    this.tableStore.settings({settings: this.userSettings});
    this.data$ = this.tableStore.data$.pipe(
      tap(table => this.tableChange.emit(table.map(row => row.map(cell => cell.value))))
    );


    this.start$ = this.tableStore.start$;
    this.startCell$ = this.start$.pipe(
      delay(0), // Allow resizing of cell before updating size of input
      map(start => this.getHTMLCellElement(start.x, start.y))
    );
    this.startCoords$ = this.startCell$.pipe(
      filter(isDefined),
      map(cell => ({cell, cellRect: cell.getBoundingClientRect()})),
      map(({cell, cellRect}) => {
        if (!cellRect) return cellRect;
        const tablePosition = this.rootRef?.nativeElement;
        const tableCoords = tablePosition?.getBoundingClientRect();
        cellRect.x += tablePosition?.scrollLeft - tableCoords?.x;
        cellRect.y += tablePosition?.scrollTop - tableCoords?.y;
        let style = window.getComputedStyle(cell);
        cellRect.width -= (parseFloat(style.getPropertyValue('padding-left')) + parseFloat(style.getPropertyValue('padding-right')));
        cellRect.height -= (parseFloat(style.getPropertyValue('padding-top')) + parseFloat(style.getPropertyValue('padding-bottom')));
        return cellRect;
      }),
      // tap(() =>this.focusInput())
    );
    // Focus input after position and size updated
    this.startCoords$.pipe(
      delay(1),
      untilDestroyed(this)
    ).subscribe(() => this.focusInput());

    this.stop$ = this.tableStore.stop$;
    this.startClasses$ = combineLatest([this.startCell$, this.tableStore.hasFocus$],
      (start, hasFocus) =>
        Array.from(start.classList)
          .reduce((o, clazz) => ({...o, [clazz]: true}), {'visible': hasFocus} as Mapper<boolean>))
    this.inputLevel$ = this.start$.pipe(map(start => start.x === 0 ? 6 : start.y === 0 ? 4 : 2))

    this.inputValue$ = this.tableStore.value$;
    this.inputValue$.pipe(untilDestroyed(this)).subscribe(value => this.value = value);

    this.startType$ = this.start$.pipe(map(start => start.x === 0 ? 'row' : start.y === 0 ? 'col' : 'cell'));
    this.isCell$ = this.startType$.pipe(map(type => type === 'cell'));
    this.settings$ = this.tableStore.settings$;

    this.tableStore.import({
      table: this.table,
      hasColNames: true,
      hasRowNames: true,
      fullImport: true
    })

  }

  ngAfterViewInit() {
    this.cornerRect = this.cornerRef.nativeElement.getBoundingClientRect();
    // Now we can find the HTML elements since they are initialised
    // this.setFirstElement()
    // this.cd.detectChanges()
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userSettings']) this.tableStore.settings({settings: this.userSettings});
  }

  mousedown($event: MouseEvent) {
    this.isDragging = true;
    let {x, y} = this.getCell($event);
    this.tableStore.write({value: this.value});
    this.selectCell(x, y, $event.shiftKey);
    $event.preventDefault()
  }

  focusInput() {
      const input = this.input?.nativeElement;
      input?.focus();
      input?.setSelectionRange(input?.value.length, input?.value.length)
      input?.scrollIntoView({block: "nearest", inline: "nearest", behavior: 'smooth'});
  }

  selectCell(x: number, y: number, shift: boolean = false) {
    if (isNaN(x) || isNaN(y)) return;
    this.tableStore.selectCell({coords: {x, y}, shift: shift});
    this.focusInput();
  }



  private previousStop: Coords;

  mousemove($event: MouseEvent) {
    if (this.isDragging) {
      let stop = this.getCell($event);
      if (this.previousStop?.x !== stop.x || this.previousStop?.y !== stop.y) this.tableStore.selectRange({stop});
      this.previousStop = stop;
    }
  }

  mouseup() {
    this.isDragging = false;
  }

  deselect() {
    this.tableStore.deselect();
  }

  addColumn() {
    this.tableStore.addColumn();
  }

  addRow() {
    this.tableStore.addRow();

  }

  deleteColumn(x: number) {
    this.tableStore.deleteColumn({x});
  }

  focusLastCell($event: any) {
    this.tableStore.focusLast()
  }

  keydown($event: KeyboardEvent, input?: HTMLInputElement): void {
    setTimeout(() => {
      const shift = $event.shiftKey;

      this.tableStore.write({value: input?.value || this.value});

      const keyToAction: Map<string, () => void> = new Map([
        ["ArrowRight", () => this.tableStore.right({shift})],
        ["ArrowLeft", () => this.tableStore.left({shift})],
        ["ArrowUp", () => this.tableStore.up({shift})],
        ["ArrowDown", () => this.tableStore.down({shift})],
        ["Delete", () => this.tableStore.delete()],
        ["Enter", () => this.tableStore.down({shift: false})],
        ["Tab", () => shift
          ? this.tableStore.left({shift: false})
          : this.tableStore.right({shift: false})
        ]
      ]);
      const action = keyToAction.get($event.key);
      if (action) {
        action.call(this);
        $event.preventDefault();
      }
    })
  }


  pasteValues($event: ClipboardEvent) {
    $event.preventDefault();
    const pastedData = $event.clipboardData?.getData('text')?.split('\n').map(row => row.split('\t'));
    if (pastedData) this.tableStore.paste({table: pastedData})
  }


  copyValues() {
    this.tableStore.range$.pipe(
      first()
    ).subscribe(range => this.clipboard.copy(range.map(row => row.join("\t")).join("\n")));
  }

  getHTMLCellElement(x: number, y: number): HTMLTableCellElement {
    return this.rootRef?.nativeElement.querySelector(`[x = '${x}'][y = '${y}']`) as HTMLTableCellElement;
  }
  getCell($event: MouseEvent): Coords {
    let x = parseInt(($event.target as HTMLTableCellElement).getAttribute("x") as string);
    let y = parseInt(($event.target as HTMLTableCellElement).getAttribute("y") as string);
    return {x, y};
  }

}
