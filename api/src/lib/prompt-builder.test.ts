import { describe, it, expect } from 'vitest';
import { buildPrompt, type RecipeData } from './prompt-builder';

describe('buildPrompt', () => {
  const baseRecipe: RecipeData = {
    title: 'Grilled Salmon with Asparagus',
    category: 'dinner',
    ingredients: ['salmon', 'asparagus', 'lemon', 'olive oil', 'garlic'],
  };

  describe('watercolor style', () => {
    it('should generate watercolor prompt with all recipe data', () => {
      const result = buildPrompt(baseRecipe, 'watercolor');

      expect(result.positive).toContain('watercolor illustration of Grilled Salmon with Asparagus');
      expect(result.positive).toContain('featuring salmon, asparagus, lemon');
      expect(result.positive).toContain('hand-painted');
      expect(result.positive).toContain('transparent washes');
      expect(result.negative).toContain('photorealistic');
      expect(result.negative).toContain('3d render');
    });

    it('should work with minimal recipe data', () => {
      const result = buildPrompt({ title: 'Pizza' }, 'watercolor');

      expect(result.positive).toContain('watercolor illustration of Pizza');
      expect(result.positive).not.toContain('featuring');
    });

    it('should default to watercolor style', () => {
      const result = buildPrompt(baseRecipe);

      expect(result.positive).toContain('watercolor illustration');
    });
  });

  describe('pencil style', () => {
    it('should generate pencil prompt with all recipe data', () => {
      const result = buildPrompt(baseRecipe, 'pencil');

      expect(result.positive).toContain('colored pencil and watercolor wash illustration');
      expect(result.positive).toContain('Grilled Salmon with Asparagus');
      expect(result.positive).toContain('fine pencil texture');
      expect(result.negative).toContain('photorealistic');
    });

    it('should work with minimal recipe data', () => {
      const result = buildPrompt({ title: 'Burger' }, 'pencil');

      expect(result.positive).toContain('colored pencil');
      expect(result.positive).toContain('Burger');
    });
  });

  describe('photo style', () => {
    it('should generate photorealistic prompt with all recipe data', () => {
      const result = buildPrompt(baseRecipe, 'photo');

      expect(result.positive).toContain('professional food photography');
      expect(result.positive).toContain('Grilled Salmon with Asparagus');
      expect(result.positive).toContain('shallow depth of field');
      expect(result.positive).toContain('4K');
      expect(result.negative).toContain('illustration');
      expect(result.negative).toContain('drawing');
    });

    it('should apply breakfast plating style', () => {
      const recipe: RecipeData = {
        title: 'Eggs Benedict',
        category: 'breakfast',
        ingredients: ['eggs', 'english muffin', 'hollandaise'],
      };
      const result = buildPrompt(recipe, 'photo');

      expect(result.positive).toContain('rustic breakfast plating');
    });

    it('should apply dessert plating style', () => {
      const recipe: RecipeData = {
        title: 'Chocolate Cake',
        category: 'dessert',
        ingredients: ['chocolate', 'flour', 'sugar'],
      };
      const result = buildPrompt(recipe, 'photo');

      expect(result.positive).toContain('elegant dessert plating');
    });

    it('should apply salad plating style', () => {
      const recipe: RecipeData = {
        title: 'Caesar Salad',
        category: 'salad',
        ingredients: ['romaine', 'parmesan', 'croutons'],
      };
      const result = buildPrompt(recipe, 'photo');

      expect(result.positive).toContain('fresh, colorful salad');
    });

    it('should apply keto/healthy plating style', () => {
      const recipe: RecipeData = {
        title: 'Keto Chicken Bowl',
        category: 'keto',
        ingredients: ['chicken', 'avocado', 'broccoli'],
      };
      const result = buildPrompt(recipe, 'photo');

      expect(result.positive).toContain('modern healthy plating');
    });

    it('should apply soup plating style', () => {
      const recipe: RecipeData = {
        title: 'Tomato Soup',
        category: 'soup',
        ingredients: ['tomatoes', 'basil', 'cream'],
      };
      const result = buildPrompt(recipe, 'photo');

      expect(result.positive).toContain('rustic bowl presentation');
    });

    it('should apply default plating style when category is unknown', () => {
      const recipe: RecipeData = {
        title: 'Mystery Dish',
        category: 'unknown-category',
        ingredients: ['ingredient1'],
      };
      const result = buildPrompt(recipe, 'photo');

      expect(result.positive).toContain('elegant plating');
    });
  });

  describe('edge cases', () => {
    it('should handle empty ingredients array', () => {
      const result = buildPrompt({ title: 'Test', ingredients: [] }, 'watercolor');

      expect(result.positive).not.toContain('featuring');
    });

    it('should limit ingredients to top 3', () => {
      const recipe: RecipeData = {
        title: 'Complex Dish',
        ingredients: ['ingredient1', 'ingredient2', 'ingredient3', 'ingredient4', 'ingredient5'],
      };
      const result = buildPrompt(recipe, 'watercolor');

      expect(result.positive).toContain('featuring ingredient1, ingredient2, ingredient3');
      expect(result.positive).not.toContain('ingredient4');
      expect(result.positive).not.toContain('ingredient5');
    });

    it('should handle undefined category', () => {
      const result = buildPrompt({ title: 'Test' }, 'photo');

      expect(result.positive).toContain('elegant plating');
    });
  });
});
