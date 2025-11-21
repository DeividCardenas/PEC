-- Add inventory fields to Producto table
ALTER TABLE `Producto`
ADD COLUMN `stock_actual` INT NOT NULL DEFAULT 0,
ADD COLUMN `stock_minimo` INT NOT NULL DEFAULT 0,
ADD COLUMN `stock_maximo` INT NULL,
ADD COLUMN `unidad_medida` VARCHAR(191) NOT NULL DEFAULT 'unidad';
