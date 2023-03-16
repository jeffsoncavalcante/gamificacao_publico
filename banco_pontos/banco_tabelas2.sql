-- COPIAR TODAS INFORMAÇÕES E COLOCAR NO MYSQL PARA CRIAR AS TABELAS
 
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `games` DEFAULT CHARACTER SET utf8 ;
USE `games` ;

-- -----------------------------------------------------
-- Table `mydb`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `games`.`users` (
  `id_users` INT NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_users`),
  UNIQUE INDEX `id_users_UNIQUE` (`id_users` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`pontos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `games`.`pontos` (
  `idpontos` INT NOT NULL auto_increment,
  `pontos_positivos` INT NULL,
  `pontos_negativos` INT NULL,
  `users_id_users` INT NOT NULL,
  `data_cadastro` DATE NOT NULL,
  PRIMARY KEY (`idpontos`),
  UNIQUE INDEX `idpontos_UNIQUE` (`idpontos` ASC) VISIBLE,
  INDEX `fk_pontos_users_idx` (`users_id_users` ASC) VISIBLE,
  CONSTRAINT `fk_pontos_users`
    FOREIGN KEY (`users_id_users`)
    REFERENCES `games`.`users` (`id_users`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`servico_cliente`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `games`.`servico_cliente` (
  `idservico_cliente` INT NOT NULL,
  `data_cadastro` DATE NOT NULL,
  `pontuado` TINYINT NOT NULL,
  PRIMARY KEY (`idservico_cliente`))
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
