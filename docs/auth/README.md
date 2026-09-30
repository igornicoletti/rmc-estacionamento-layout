# Autenticação

Esta pasta registra a implementação incremental do contrato canônico de
autenticação v1.0. O contrato é a fonte normativa; estes documentos apenas
registram o estado do checkout e as decisões derivadas, sem criar uma segunda
matriz de autorização.

## Estado atual

A implementação começou na F00. A configuração candidata usa o Worker
`https://rmc-estacionamento.igor93nicoletti.workers.dev`; o fluxo Auth continua
desabilitado: não há banco, provider, gateway SMS ou credenciais de servidor
configurados neste repositório. O shell e suas fixtures atuais são demonstração
visual, não uma sessão autenticada. Nenhuma rota ou UI de autenticação real foi
habilitada por esta fase.

As próximas entregas seguem a ordem do contrato: F01 contratos puros, F02
persistência e F03 fronteira BFF. A implementação visual da jornada depende
dos adapters e dos gates correspondentes; ela não será antecipada pelo
frontend.

- [Registro do contrato e baseline F00](contract-registry.md)

## Configuração pública

`src/features/auth/config/auth-runtime-config.ts` valida somente valores
públicos no build. `VITE_AUTH_STAGE` aceita `disabled` (padrão) ou `candidate`.
Em `candidate`, `VITE_AUTH_API_ORIGIN` deve ser uma origem HTTPS, sem caminho,
credenciais, query ou fragmento. `validated` é recusado no bundle porque exige
manifesto e prova do target fora dele.

Nunca inclua chaves, tokens, cookies, URLs privilegiadas ou segredos em
variáveis `VITE_*`.
