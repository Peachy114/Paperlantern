import * as yup from 'yup'

export const shopFormSchema = yup.object({
  title: yup.string().trim().required('Title is required').max(120, 'Title is too long'),
  description: yup.string().trim().max(2000, 'Description is too long'),
  type: yup
    .mixed<'download' | 'adoptable' | 'sticker'>()
    .oneOf(['download', 'adoptable', 'sticker'])
    .required('Type is required'),
  labels: yup.string().trim(),
  status: yup
    .mixed<'draft' | 'published' | 'archived'>()
    .oneOf(['draft', 'published', 'archived'])
    .required('Status is required'),
  download_policy: yup.mixed<'free' | 'paid'>().oneOf(['free', 'paid']).required(),
  credit_cost: yup
    .string()
    .when('download_policy', {
      is: 'paid',
      then: (schema) =>
        schema
          .required('Credit cost is required for paid items')
          .test('is-positive', 'Credit cost must be greater than 0', (v) => Number(v) > 0),
      otherwise: (schema) => schema.notRequired(),
    }),
  usage: yup.object({
    comments: yup.boolean().required(),
    profile: yup.boolean().required(),
    backgrounds: yup.boolean().required(),
    messages: yup.boolean().required(),
  }),
  // Use File generic only; allow null via .nullable()
  image: yup.mixed<File>().nullable(),
  files: yup.array(),
})


export type ShopFormErrors = Partial<
  Record<
    'title' | 'description' | 'type' | 'labels' | 'status' | 'download_policy' | 'credit_cost' | 'image' | 'files',
    string
  >
>