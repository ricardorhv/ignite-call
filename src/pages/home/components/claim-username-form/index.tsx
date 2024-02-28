import { Button, TextInput } from '@ricardorhv-ignite-ui/react'
import { Form } from './styles'

import { ArrowRight } from 'phosphor-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const clainUsernameFormSchema = z.object({
  username: z.string(),
})

type ClaimUsernameFormData = z.infer<typeof clainUsernameFormSchema>

export function ClaimUsernameForm() {
  const { register, handleSubmit } = useForm()

  async function handleClaimUsername(data: any) {
    console.log(data)
  }

  return (
    <Form as="form" onSubmit={handleSubmit(handleClaimUsername)}>
      <TextInput
        container={{ size: 'sm' }}
        prefix="ignite.com/"
        placeholder="seu-usuario"
        {...register('username')}
      />
      <Button size="sm" type="submit">
        Reservar
        <ArrowRight />
      </Button>
    </Form>
  )
}
