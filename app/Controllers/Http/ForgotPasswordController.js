'use strict'

const User = use('App/Models/User')
const crypto = require('crypto')
const moment = require('moment')

const Mail = use('Mail')

class ForgotPasswordController {
  async store ({ request, response }) {
    try {
      const email = request.input('email')
      const user = await User.findByOrFail('email', email)

      user.token = crypto.randomBytes(10).toString('hex')
      user.token_created_at = new Date()

      await user.save()

      await Mail.send(
        ['emails.forgot_password'],
        {
          email,
          token: user.token,
          link: `${request.input('redirect_url')}/?token=${user.token}`
        },
        message => {
          message
            .to(user.email)
            .from('eddy@mysystem.com', 'Edilmar | Santos')
            .subject('Recuperação de senha')
        }
      )
    } catch (error) {
      return response
        .status(error.status)
        .send({ error: { message: 'Ocorreu um erro, esse e-mail existe?' } })
    }
  }

  async update ({ request, response }) {
    try {
      const { token, password } = request.all()

      const user = await User.findByOrFail('token', token)
      console.log('user = ', user)
      const isTokenExpired = moment()
        .subtract('2', 'days')
        .isAfter(user.token_created_at)
      console.log('is caralaho', isTokenExpired)
      if (isTokenExpired) {
        return response
          .status(401)
          .send({ error: { message: 'Token expirado' } })
      }

      user.token = null
      user.token_created_at = null
      user.password = password

      await user.save()
    } catch (error) {
      return response
        .status(error.status)
        .send({
          error: {
            message: 'Ocorreu um erro ao resetar sua senha. Tente novamente'
          }
        })
    }
  }
}

module.exports = ForgotPasswordController
