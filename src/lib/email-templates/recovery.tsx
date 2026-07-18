import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="sq" dir="ltr">
    <Head />
    <Preview>Rivendos fjalëkalimin tënd për {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Rivendos fjalëkalimin</Heading>
        <Text style={text}>
          Kemi marrë një kërkesë për rivendosjen e fjalëkalimit tënd në {siteName}.
          Kliko butonin më poshtë për të zgjedhur një fjalëkalim të ri.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Rivendos fjalëkalimin
        </Button>
        <Text style={footer}>
          Nëse nuk e ke kërkuar rivendosjen e fjalëkalimit, mund ta injorosh këtë
          email. Fjalëkalimi yt nuk do të ndryshojë.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
