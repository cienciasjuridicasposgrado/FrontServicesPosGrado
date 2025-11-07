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
            unidad: ['', [Validators.required]],
            stock: [0, [Validators.required, Validators.min(1)]]
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
        .then(item => this.form.patchValue(item))
        .catch(() => {
            this.notificationService.showError('No se pudo cargar el item.');
            this.router.navigate(['/dashboard/items']);
        });
    }

    save() {
        if (this.form.invalid) return;

        const rawValue = this.form.getRawValue();

        const value = {
            ...rawValue,
            codigo: rawValue.codigo.trim().toUpperCase(),
            stock: Number(rawValue.stock)
        };

        if (this.isEditMode) {
            this.updateItemUseCase.execute(this.codigo, value)
            .then(() => {
                this.notificationService.showSuccess('Item actualizado con éxito.');
                this.router.navigate(['/dashboard/items']);
            })
            .catch(err => this.notificationService.showError(err.message));
        } else {
            this.createItemUseCase.execute(value)
            .then(() => {
                this.notificationService.showSuccess('Item creado con éxito.');
                this.router.navigate(['/dashboard/items']);
            })
            .catch(err => this.notificationService.showError(err.message));
        }
    }

    cancel() {
        this.router.navigate(['/dashboard/items']);
    }
}