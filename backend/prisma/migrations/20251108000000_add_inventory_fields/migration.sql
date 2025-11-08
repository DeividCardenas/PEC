-- Add inventory fields to Producto table
ALTER TABLE `Producto`
ADD COLUMN IF NOT EXISTS `stock_actual` INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `stock_minimo` INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `stock_maximo` INT NULL,
ADD COLUMN IF NOT EXISTS `unidad_medida` VARCHAR(191) NOT NULL DEFAULT 'unidad';
