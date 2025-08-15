import { Router } from 'express'
import { CategoriesController } from './categories.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { CreateCategoryDto, UpdateCategoryDto, CategoryParamsDto, CategoryQueryDto } from './categories.dto'

const router = Router()

router.get(
  '/',
  requireAuth,
  validateQuery(CategoryQueryDto),
  CategoriesController.getCategories
)

router.get(
  '/:id',
  requireAuth,
  validateParams(CategoryParamsDto),
  validateQuery(CategoryQueryDto),
  CategoriesController.getCategoryById
)

router.post(
  '/',
  requireAuth,
  validateBody(CreateCategoryDto),
  CategoriesController.createCategory
)

router.put(
  '/:id',
  requireAuth,
  validateParams(CategoryParamsDto),
  validateBody(UpdateCategoryDto),
  CategoriesController.updateCategory
)

router.delete(
  '/:id',
  requireAuth,
  validateParams(CategoryParamsDto),
  CategoriesController.deleteCategory
)

export { router as categoriesRouter }