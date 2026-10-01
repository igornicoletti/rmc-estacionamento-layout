# Tema

**Natureza:** referência vigente. **Escopo:** src/components/theme.
**Revisão:** 01/10/2026. **Baseline:** `6daa9bed8971928ed7b63749e9b493645de78025` + manutenção pré-F03 nesta branch.
**Status:** implementação existente descrita; resultados de execução ficam no [manifesto](../auth/evidence/pre-f03-maintenance-local.md), não são inferidos desta referência.

## Sumário navegável

- [Contrato](#c1)
- [Uso e testes](#c2)
- [Limites e referências](#c3)

<a id="c1"></a>

## Contrato

ThemeProvider fornece light/dark/system, padrão system, chave rmc-ui-theme. ThemeContext/useTheme centralizam consumo; valor inválido armazenado usa fallback. Falha de localStorage preserva seleção em memória.

Tema system acompanha matchMedia com cleanup; sem matchMedia usa light. Classe light/dark e colorScheme são aplicados ao documento. Tokens estão em src/index.css; não há inferência de autenticação ou persistência de sessão.

<a id="c2"></a>

## Uso e testes

Monte provider uma vez em AppProviders; HeaderUserMenu chama setTheme somente após isTheme. `tests/integration/theme.test.tsx` cobre persistência, storage indisponível, sistema e remoção de listeners. Menu do usuário e E2E verificam seleção real; [catálogo](../project/validation.md#catalog).

<a id="c3"></a>

## Limites e referências

Tema é preferência de apresentação; não é armazenamento de tokens. [React effects](https://react.dev/reference/react/useEffect), [Tailwind theme](https://tailwindcss.com/docs/theme).
