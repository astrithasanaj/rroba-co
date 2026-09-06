import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  token,
}: SignupEmailProps) => (
  <Html lang="sq" dir="ltr">
    <Head />
    <Preview>Konfirmo email-in tënd për {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Konfirmo email-in tënd</Heading>
        <Text style={text}>
          Faleminderit që u regjistrove në{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Të lutem konfirmo adresën tënde të email-it (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) duke klikuar butonin më poshtë:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verifiko email-in
        </Button>
        {token ? (
          <>
            <Text style={{ ...text, margin: '30px 0 8px' }}>
              Ose shkruaj këtë kod në aplikacion:
            </Text>
            <Text style={code}>{token}</Text>
            <Text style={{ ...text, margin: '0' }}>
              Kodi skadon pas 1 ore.
            </Text>
          </>
        ) : null}
        <Text style={footer}>
          Nëse nuk e ke krijuar këtë llogari, mund ta injorosh këtë email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
