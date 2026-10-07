import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CreateItemUseCase } from '../../../../core/application/usecase/items/create-item.usecase';
import { UpdateItemUseCase } from '../../../../core/application/usecase/items/update-item.usecase';
import { GetItemByCodigoUseCase } from '../../../../core/application/usecase/items/get-item-by-codigo.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { CreateItemModel, UpdateItemModel } from '../../../../core/domain/models/item.model';
import { httpErrorMessage } from '../../../../shared/utils/http-error-message';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatCardModule, MatInputModule, MatButtonModule],
  templateUrl: './item-form.component.html',
  styleUrls: ['./item-form.component.scss'],
  providers: [NotificationService]
})
export class ItemFormComponent implements OnInit {

    form!: FormGroup;
    isEditMode = false;
    codigo!: string;
    currentStock: number | null = null;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private createItemUseCase: CreateItemUseCase,
        private updateItemUseCase: UpdateItemUseCase,
        private getItemUseCase: GetItemByCodigoUseCase,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            codigo: ['', [Validators.required]],
            nombreItem: ['', [Validators.required]],
            unidad: ['', [Validators.required]]
        });

        this.codigo = this.route.snapshot.paramMap.get('codigo') as string;

        if (this.codigo) {
            this.isEditMode = true;

            this.form.get('codigo')?.disable();

            this.loadItem(this.codigo);
        }
    }

    loadItem(codigo: string) {
        this.getItemUseCase.execute(codigo)
        .then(item => {
            this.currentStock = item.stock;
            this.form.patchValue({
                codigo: item.codigo,
                nombreItem: item.nombreItem,
                unidad: item.unidad
            });
        })
        .catch(error => {
            this.notificationService.showError(httpErrorMessage(error, 'No se pudo cargar el ítem.'));
            this.router.navigate(['/dashboard/items']);
        });
    }

    save() {
        if (this.form.invalid) return;

        if (this.isEditMode) {
            const update: UpdateItemModel = {
                nombreItem: this.form.controls['nombreItem'].value,
                unidad: this.form.controls['unidad'].value
            };
            this.updateItemUseCase.execute(this.codigo, update)
            .then(() => {
                this.notificationService.showSuccess('Item actualizado con éxito.');
                this.router.navigate(['/dashboard/items']);
            })
            .catch(error => this.notificationService.showError(
                httpErrorMessage(error, 'No se pudo actualizar el ítem.')
            ));
        } else {
            const create: CreateItemModel = {
                codigo: this.form.controls['codigo'].value.trim().toUpperCase(),
                nombreItem: this.form.controls['nombreItem'].value,
                unidad: this.form.controls['unidad'].value
            };
            this.createItemUseCase.execute(create)
            .then(() => {
                this.notificationService.showSuccess('Item creado con éxito.');
                this.router.navigate(['/dashboard/items']);
            })
            .catch(error => this.notificationService.showError(
                httpErrorMessage(error, 'No se pudo crear el ítem.')
            ));
        }
    }

    cancel() {
        this.router.navigate(['/dashboard/items']);
    }
}
