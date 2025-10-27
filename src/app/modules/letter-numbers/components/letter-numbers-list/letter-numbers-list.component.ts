import { Component, OnInit, ViewChild } from "@angular/core";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { DeleteLetterNumberUseCase } from "../../../../core/application/usecase/letter-numbers/delete-letter-number.usecase";
import { GetLetterNumbersUseCase } from "../../../../core/application/usecase/letter-numbers/get-letter-numbers.usecase";
import { LetterNumberModel } from "../../../../core/domain/models/letter-number.model";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { LetterNumberFormComponent } from "../letter-number-form/letter-number-form.component";
import { NotificationService } from "../../../../shared/services/notification.service";

@Component({
  selector: 'app-letter-numbers-list',
  standalone: true,
  templateUrl: './letter-numbers-list.component.html',
  styleUrls: ['./letter-numbers-list.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  providers: [NotificationService]
})
export class LetterNumbersListComponent implements OnInit {
    displayedColumns = ['id', 'numero_carta', 'user', 'fecha', 'observacion', 'acciones'];
    dataSource = new MatTableDataSource<LetterNumberModel>([]);
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    constructor(
        private getLetters: GetLetterNumbersUseCase,
        private deleteLetter: DeleteLetterNumberUseCase,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    async loadData() {
      try {
        const data: LetterNumberModel[] = await this.getLetters.execute();
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      } catch (err: any) {
        console.error("Error al cargar los números de carta:", err);
      }
    }

    openForm(element?: LetterNumberModel) {
        const dialogRef = this.dialog.open(LetterNumberFormComponent, {
        width: '400px',
        data: element || null
        });

        dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadData();
        });
    }

    async delete(id: number) {
        if (confirm('Seguro que desea eliminar este numero de carta?')) {
            try {
                await this.deleteLetter.execute(id);
                this.loadData();
            } catch (err: any) {
                console.error("Error al eliminar el numero de carta:", err);
            }
        }
    }
}