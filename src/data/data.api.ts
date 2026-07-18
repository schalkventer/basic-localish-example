import { z } from "zod";

const schemas = {
  single: {
    response: z.object({
      id: z.string().brand("RECIPE_ID"),
      source_url: z.string(),
      domain: z.string(),
      title: z.string(),
      image_url: z.string(),
      author: z.string().nullable(),
      yields: z.string().nullable(),
      prep_time: z.number().nullable(),
      cook_time: z.number().nullable(),
      total_time: z.number().nullable(),
      ingredients: z.array(z.string()),
      instructions: z.array(z.string()),
      tags: z.array(z.string()),
      cuisine: z.string().nullable(),
      category: z.string().nullable(),
      keywords: z.array(z.string()),
      schema_valid: z.boolean(),
      extracted_at: z.string(),
      last_checked: z.string(),

      reduction: z.object({
        original_words: z.number(),
        recipe_words: z.number(),
        words_removed: z.number(),
        bloat_percent: z.number(),
        ads_detected: z.number(),
      }),

      nutrition: z.object({
        calories: z.number().nullable(),
        protein_g: z.number().nullable(),
        fat_g: z.number().nullable(),
        carbs_g: z.number().nullable(),
        fiber_g: z.number().nullable(),
        sodium_mg: z.number().nullable(),
        source: z.string(),
      }),
    }),
  },

  list: {
    response: z.object({
      has_more: z.boolean().optional(),
      search_mode: z.literal("keyword").optional(),
      next_cursor: z.string().optional(),

      items: z.array(
        z.object({
          id: z.string().brand("RECIPE_ID"),
          category: z.string().nullable(),
          cook_time: z.number().nullable(),
          cuisine: z.string().nullable(),
          domain: z.string(),
          image_url: z.string(),
          tags: z.array(z.string()),
          title: z.string(),
          total_time: z.number().nullable(),
          yields: z.string().nullable(),
        }),
      ),
    }),

    params: z.object({
      q: z.string().optional(),
      offset: z.number().optional(),
      cursor: z.string().optional(),
      mode: z.enum(["keyword", "semantic", "hybrid"]),
      limit: z.number(),
      max_time: z.number().optional(),
      tags: z.string().optional(),
      sort: z.string().optional(),
    }),
  },
};

export type SingleRecipeResponse = z.infer<typeof schemas.single.response>;
export type ListRecipeResponse = z.infer<typeof schemas.list.response>;
export type ListRecipeParams = z.infer<typeof schemas.list.params>;

export const getSingle = async (props: {
  id: string;
}): Promise<z.infer<typeof schemas.single.response>> => {
  const { id } = props;

  const response = await fetch(
    `https://reducedrecipes.com/api/v1/recipes/${id}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recipe with id ${id}`);
  }

  const result = await response.json();
  return schemas.single.response.parse(result);
};

export const getList = async (props: {
  params: z.infer<typeof schemas.list.params>;
}): Promise<z.infer<typeof schemas.list.response>> => {
  const { params } = props;
  const url = new URL(
    `https://reducedrecipes.com/api/v1/${params.q ? "search" : "recipes"}`,
  );

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Failed to fetch recipe list`);

  const result = await response.json();
  return schemas.list.response.parse(result);
};

export const getBookmarked = (): string[] => {
  return JSON.parse(localStorage.getItem("bookmarked") || "[]");
};

export const setBookmarked = (values: string[]) => {
  localStorage.setItem("bookmarked", JSON.stringify(values));
};
