import * as simeplWebAuthnServer from '@simplewebauthn/server'
import { VerifiedRegistrationResponse } from '@simplewebauthn/server'
import { Result } from '@standardnotes/domain-core'
import { Authenticator } from '../../Authenticator/Authenticator'

import { AuthenticatorChallenge } from '../../Authenticator/AuthenticatorChallenge'
import { AuthenticatorChallengeRepositoryInterface } from '../../Authenticator/AuthenticatorChallengeRepositoryInterface'
import { AuthenticatorRepositoryInterface } from '../../Authenticator/AuthenticatorRepositoryInterface'
import { VerifyAuthenticatorRegistrationResponse } from './VerifyAuthenticatorRegistrationResponse'

describe('VerifyAuthenticatorRegistrationResponse', () => {
  let authenticatorRepository: AuthenticatorRepositoryInterface
  let authenticatorChallengeRepository: AuthenticatorChallengeRepositoryInterface

  const createUseCase = () =>
    new VerifyAuthenticatorRegistrationResponse(authenticatorRepository, authenticatorChallengeRepository)

  beforeEach(() => {
    authenticatorRepository = {} as jest.Mocked<AuthenticatorRepositoryInterface>
    authenticatorRepository.save = jest.fn()

    authenticatorChallengeRepository = {} as jest.Mocked<AuthenticatorChallengeRepositoryInterface>
    authenticatorChallengeRepository.findByUserUuidAndChallenge = jest.fn().mockReturnValue({
      props: {
        challenge: Buffer.from('challenge'),
      },
    } as jest.Mocked<AuthenticatorChallenge>)
  })

  it('should return error if user uuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: 'invalid',
      challenge: Buffer.from('challenge'),
      registrationCredential: {
        id: Buffer.from('id'),
        rawId: Buffer.from('rawId'),
        response: {
          attestationObject: Buffer.from('attestationObject'),
          clientDataJSON: Buffer.from('clientDataJSON'),
        },
        type: 'type',
      },
    })

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toEqual(
      'Could not verify authenticator registration response: Given value is not a valid uuid: invalid',
    )
  })

  it('should return error if challenge is not found', async () => {
    authenticatorChallengeRepository.findByUserUuidAndChallenge = jest.fn().mockReturnValue(null)

    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      challenge: Buffer.from('challenge'),
      registrationCredential: {
        id: Buffer.from('id'),
        rawId: Buffer.from('rawId'),
        response: {
          attestationObject: Buffer.from('attestationObject'),
          clientDataJSON: Buffer.from('clientDataJSON'),
        },
        type: 'type',
      },
    })

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toEqual('Could not verify authenticator registration response: challenge not found')
  })

  it('should return error if verification could not verify', async () => {
    authenticatorChallengeRepository.findByUserUuidAndChallenge = jest.fn().mockReturnValue({
      props: {
        challenge: Buffer.from('challenge'),
      },
    } as jest.Mocked<AuthenticatorChallenge>)

    const useCase = createUseCase()

    const mock = jest.spyOn(simeplWebAuthnServer, 'verifyRegistrationResponse')
    mock.mockImplementation(() => {
      return Promise.resolve({
        verified: false,
        registrationInfo: {
          counter: 1,
          credentialBackedUp: true,
          credentialDeviceType: 'singleDevice',
          credentialID: Buffer.from('test'),
          credentialPublicKey: Buffer.from('test'),
        },
      } as jest.Mocked<VerifiedRegistrationResponse>)
    })

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      challenge: Buffer.from('invalid'),
      registrationCredential: {
        id: Buffer.from('id'),
        rawId: Buffer.from('rawId'),
        response: {
          attestationObject: Buffer.from('attestationObject'),
          clientDataJSON: Buffer.from('clientDataJSON'),
        },
        type: 'type',
      },
    })

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toEqual('Could not verify authenticator registration response: verification failed')

    mock.mockRestore()
  })

  it('should return error if authenticator could not be created', async () => {
    authenticatorChallengeRepository.findByUserUuidAndChallenge = jest.fn().mockReturnValue({
      props: {
        challenge: Buffer.from('challenge'),
      },
    } as jest.Mocked<AuthenticatorChallenge>)

    const useCase = createUseCase()

    const mock = jest.spyOn(simeplWebAuthnServer, 'verifyRegistrationResponse')
    mock.mockImplementation(() => {
      return Promise.resolve({
        verified: true,
        registrationInfo: {
          counter: 1,
          credentialBackedUp: true,
          credentialDeviceType: 'singleDevice',
          credentialID: Buffer.from('test'),
          credentialPublicKey: Buffer.from('test'),
        },
      } as jest.Mocked<VerifiedRegistrationResponse>)
    })

    const mockAuthenticator = jest.spyOn(Authenticator, 'create')
    mockAuthenticator.mockImplementation(() => {
      return Result.fail('Oops')
    })

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      challenge: Buffer.from('invalid'),
      registrationCredential: {
        id: Buffer.from('id'),
        rawId: Buffer.from('rawId'),
        response: {
          attestationObject: Buffer.from('attestationObject'),
          clientDataJSON: Buffer.from('clientDataJSON'),
        },
        type: 'type',
      },
    })

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toEqual('Could not verify authenticator registration response: Oops')

    mock.mockRestore()
    mockAuthenticator.mockRestore()
  })

  it('should verify authenticator registration response', async () => {
    authenticatorChallengeRepository.findByUserUuidAndChallenge = jest.fn().mockReturnValue({
      props: {
        challenge: Buffer.from('challenge'),
      },
    } as jest.Mocked<AuthenticatorChallenge>)

    const useCase = createUseCase()

    const mock = jest.spyOn(simeplWebAuthnServer, 'verifyRegistrationResponse')
    mock.mockImplementation(() => {
      return Promise.resolve({
        verified: true,
        registrationInfo: {
          counter: 1,
          credentialBackedUp: true,
          credentialDeviceType: 'singleDevice',
          credentialID: Buffer.from('test'),
          credentialPublicKey: Buffer.from('test'),
        },
      } as jest.Mocked<VerifiedRegistrationResponse>)
    })

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      challenge: Buffer.from('invalid'),
      registrationCredential: {
        id: Buffer.from('id'),
        rawId: Buffer.from('rawId'),
        response: {
          attestationObject: Buffer.from('attestationObject'),
          clientDataJSON: Buffer.from('clientDataJSON'),
        },
        type: 'type',
      },
    })

    expect(result.isFailed()).toBeFalsy()

    mock.mockRestore()
  })
})