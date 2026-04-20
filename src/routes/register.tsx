import RegisterPage from '#/features/register/pages/RegisterPage'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '#/lib/auth'

export const Route = createFileRoute('/register')({
  //       throw redirect({
  //         to: '/dashboard',
  //       })
  //     }
  //   }
  // },
  component: RegisterPage,
})
