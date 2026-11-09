# Veloz

**Interface reativa de granularidade fina com JSX. Sem DOM virtual, sem re-render: os signals atualizam exatamente os nós do DOM que dependem deles.**

[English](README.md)

- **Signals, memos e effects** com atualizações em lote, sem estados intermediários inconsistentes, e limpeza automática.
- **Componentes rodam uma vez.** O JSX cria nós reais do DOM; a reatividade está nas funções que você passa.
- **SSR e hidratação**: `renderToString` no servidor, `hydrate` no cliente, com os mesmos componentes.
- **CSS-in-JS com escopo**: `css`, `styled` e a prop `css`. Compatível com CSP e coletado durante o SSR.
- **Seguro por padrão**: texto nunca é interpretado como HTML, URLs e nomes de atributo são validados, `innerHTML` é sanitizado.
- **TypeScript em primeiro lugar**, só ESM, sem dependências em tempo de execução.

## Pacotes

| Pacote | O que faz |
| --- | --- |
| [`@velozjs/core`](packages/core) | Signals, memos, effects, ownership, contexto. Roda em qualquer lugar (sem DOM). |
| [`@velozjs/dom`](packages/dom) | Runtime JSX, `render`, `hydrate`, `Show`, `For`, `Switch`, `ErrorBoundary`, `Portal`, sanitizador. |
| [`@velozjs/css`](packages/css) | `css`, `styled`, a prop `css`, coleta de estilos no SSR. |
| [`@velozjs/ssr`](packages/ssr) | `renderToString`, `renderToStream`, versões de servidor dos componentes. |
| [`vite-plugin-veloz`](packages/vite-plugin) | Configuração do JSX e resolução de módulos no SSR para o Vite. |

## Começo rápido

```bash
npm install @velozjs/dom @velozjs/css
npm install -D vite vite-plugin-veloz typescript
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import veloz from 'vite-plugin-veloz';

export default defineConfig({ plugins: [veloz()] });
```

```json
// tsconfig.json (compilerOptions)
{ "jsx": "react-jsx", "jsxImportSource": "@velozjs/dom" }
```

```tsx
// src/main.tsx
import { render, createSignal, createMemo, Show } from '@velozjs/dom';
import '@velozjs/css';

function Counter() {
  const [count, setCount] = createSignal(0);
  const doubled = createMemo(() => count() * 2);

  return (
    <div css={{ display: 'grid', gap: '0.5rem', placeItems: 'center' }}>
      <p>Contagem: {count} · dobro: {doubled}</p>
      <button onClick={() => setCount((c) => c + 1)}>Somar um</button>
      <Show when={() => count() >= 10}>
        <p>Já são muitos cliques.</p>
      </Show>
    </div>
  );
}

render(() => <Counter />, document.getElementById('app')!);
```

`{count}` funciona porque o getter é uma função: toda função no JSX vira uma região viva, atualizada quando os signals que ela lê mudam.

## Como pensar

Um componente Veloz é uma função comum que **roda uma vez** e devolve nós do DOM. Nada roda de novo sozinho. O que muda são as **funções** que você coloca no JSX:

```tsx
<p class={() => (done() ? 'done' : '')}>   {/* atributo reativo */}
  {() => `${left()} itens restantes`}      {/* texto reativo */}
</p>
```

Três regras cobrem quase tudo:

1. **Leia signals dentro de funções** (`{() => a() + b()}`, `class={() => ...}`), não no corpo do componente, se quiser atualizações.
2. **As props chegam como foram passadas.** Uma prop função continua função, então callbacks e render props funcionam. Para aceitar um valor *ou* um signal, tipe como `MaybeAccessor<T>` e leia com `access(props.x)`.
3. **Passe uma função para renderizar sob demanda.** Os filhos do JSX são criados antes do pai rodar. Escreva `{() => <Pesado />}` quando o conteúdo só deve ser criado ao aparecer, ou dentro do escopo de um `Provider` / `ErrorBoundary`.

## Reatividade

```ts
import { createSignal, createMemo, createEffect, batch, untrack, on, onCleanup } from '@velozjs/core';

const [first, setFirst] = createSignal('Ada');
const [last, setLast] = createSignal('Lovelace');
const full = createMemo(() => `${first()} ${last()}`); // em cache, recalcula só quando precisa

createEffect(() => {
  document.title = full();
  const id = setInterval(() => {}, 1000);
  onCleanup(() => clearInterval(id)); // roda antes da próxima execução e no descarte
});

batch(() => { setFirst('Grace'); setLast('Hopper'); }); // os effects rodam uma vez
untrack(() => full());                                   // lê sem se inscrever
createEffect(on(first, (value, prev) => console.log(prev, '→', value), { defer: true }));
```

Um effect nunca vê um memo desatualizado e roda uma vez por mudança, mesmo quando várias fontes mudam juntas. Effects criados dentro de um componente (ou de um ramo do `Show`, de uma linha do `For`...) são **descartados junto com ele**.

Também há: `createResource` (veja [Dados assíncronos](#dados-assíncronos)), `createRoot(dispose => ...)` para escopos que você mesmo descarta, `catchError(fn, handler)`, `createContext` / `useContext`, `onMount`.

## Dados assíncronos

O `createResource` transforma uma promise em signal. Envolva a parte que o lê com `<Suspense>` para mostrar um fallback enquanto carrega, e com `<ErrorBoundary>` para tratar falhas.

```tsx
import { createResource, createSignal, Suspense, ErrorBoundary } from '@velozjs/dom';

function Post(props: { id: () => number }) {
  // Busca de novo sempre que props.id() muda; respostas atrasadas são ignoradas.
  const [post, { refetch }] = createResource(props.id, (id) =>
    fetch(`/api/posts/${id}`).then((r) => r.json())
  );

  return (
    <article>
      <h2>{() => post()?.title}</h2>
      <button onClick={() => refetch()} disabled={() => post.loading}>Recarregar</button>
    </article>
  );
}

function Page() {
  const [id, setId] = createSignal(1);
  return (
    <ErrorBoundary fallback={(err, reset) => <p>{err.message} <button onClick={reset}>Tentar de novo</button></p>}>
      {() => (
        <Suspense fallback={<p>Carregando...</p>}>
          {() => <Post id={id} />}
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
```

- `post()` é o valor (undefined até a primeira carga); `post.state` é `unresolved`, `pending`, `ready`, `refreshing` ou `errored`; `post.loading`, `post.error` e `post.latest` também são reativos.
- O `Suspense` mostra o fallback enquanto um recurso lido dentro dele carrega **pela primeira vez**. Recargas mantêm o conteúdo atual na tela (use `post.loading` para um indicador). O conteúdo é criado uma vez e continua vivo enquanto escondido.
- Uma carga que falhou lança erro ao ser lida, e o `ErrorBoundary` mais próximo mostra o fallback dele.
- Sem fonte, o fetcher roda uma vez. Com fonte (`createResource(fonte, fetcher)`), roda de novo quando a fonte muda, e não roda enquanto ela for `false`, `null` ou `undefined`.
- `mutate(valor)` define o valor localmente (atualização otimista); `refetch()` carrega de novo.

No servidor, o `renderToStringAsync` espera os dados (veja [Renderização no servidor](#renderização-no-servidor)), então o HTML já sai com eles e o cliente não busca de novo.

## Controle de fluxo

```tsx
<Show when={() => user()} fallback={<SignIn />}>
  {(u) => <Dashboard user={u} />}
</Show>

<For each={() => todos()} fallback={<p>Nada a fazer</p>}>
  {(todo, index) => <li>{() => index() + 1}. {todo.title}</li>}
</For>

<Switch fallback={<NotFound />}>
  <Match when={() => route() === 'home'}><Home /></Match>
  <Match when={() => route() === 'about'}><About /></Match>
</Switch>

<ErrorBoundary fallback={(err, reset) => <button onClick={reset}>{err.message}: tentar de novo</button>}>
  {() => <Widget />}
</ErrorBoundary>

<Portal mount={document.body}>{() => <Modal />}</Portal>

<Dynamic component={level === 1 ? 'h1' : 'h2'}>Título</Dynamic>
```

- O `For` identifica as linhas pela **identidade do item**: as linhas existentes (DOM, foco e estado) são mantidas e movidas, só itens novos renderizam, linhas removidas são descartadas.
- O `ErrorBoundary` captura erros lançados ao renderizar os filhos **e nos effects que eles criarem depois**.
- O conteúdo de um `Portal` recebe eventos normalmente.

## Estilos

```tsx
import { css, styled } from '@velozjs/css';

const card = css`
  padding: 1.5rem;
  border-radius: 12px;
  &:hover { box-shadow: 0 4px 12px rgb(0 0 0 / 0.1); }
  @media (min-width: 40em) { & { padding: 2rem; } }
`;

const Button = styled('button')`
  padding: 0.5rem 1rem;
  background: ${(p: { tone?: string }) => (p.tone === 'danger' ? 'crimson' : 'royalblue')};
`;

<div class={card}>
  <Button tone="danger" onClick={remove}>Excluir</Button>
  <span css={{ color: 'gray', '&:hover': { color: 'black' }, '@media (min-width: 40em)': { fontSize: '1.25rem' } }}>
    dica
  </span>
</div>
```

Os nomes de classe são hashes do conteúdo (`v-1x2y3z`). Os estilos vão para uma folha de estilo construída via JS (sem escrever `<style>` inline, compatível com CSP) e não se repetem. Importe `@velozjs/css` uma vez na entrada do cliente: é esse import que ativa a prop `css`.

Prefere uma folha de estilo comum? O Veloz funciona com qualquer CSS, inclusive bibliotecas de classes utilitárias.

## Renderização no servidor

```tsx
// entry-server.tsx
import { renderToString } from '@velozjs/ssr';
import { App } from './App';

export function render(url: string) {
  return renderToString(() => <App url={url} />); // { html, css }
}
```

```ts
// servidor: coloque o resultado no seu HTML
const { html, css } = render(req.url);
res.end(template
  .replace('<!--ssr-css-->', `<style data-veloz-css>${css}</style>`)
  .replace('<!--ssr-outlet-->', html));
```

```tsx
// entry-client.tsx
import { hydrate } from '@velozjs/dom';
import '@velozjs/css';
import { App } from './App';

hydrate(() => <App url={location.pathname} />, document.getElementById('app')!);
```

### Com dados assíncronos

O `renderToString` é síncrono: recursos que ainda estão carregando renderizam o fallback do `Suspense`. Para enviar a página já com os dados, use o `renderToStringAsync`:

```ts
import { renderToStringAsync } from '@velozjs/ssr';

const { html, css, script } = await renderToStringAsync(() => <App url={req.url} />, { timeout: 5000 });
res.end(template
  .replace('<!--ssr-css-->', `<style data-veloz-css>${css}</style>`)
  .replace('<!--ssr-outlet-->', html + script)); // o script precisa rodar antes da entrada do cliente
```

Ele renderiza, espera as buscas pendentes e renderiza de novo com os valores (repetindo quando uma requisição depende de outra). O `script` entrega os valores ao `hydrate()`, que inicia cada recurso com eles em vez de buscar. Os valores precisam ser serializáveis em JSON; cargas que falharam são enviadas com a mensagem de erro. Opções: `timeout` (ms), `maxPasses` (padrão 10) e `nonce` para CSP.

Os recursos são associados entre servidor e cliente pela ordem de criação. Se um componente cria recursos condicionalmente de um jeito que difere entre os dois, dê a eles um `name` estável: `createResource(fetcher, { name: 'user' })`.

### Como as peças se encaixam

- Com o `vite-plugin-veloz`, os imports de `@velozjs/dom` do app apontam para `@velozjs/ssr` durante o SSR (em dev e em `vite build --ssr`), então os componentes são compartilhados sem mudança.
- O servidor marca os elementos com chaves `data-hk` e envolve as regiões dinâmicas em comentários `<!--[-->…<!--]-->`. O `hydrate()` reaproveita esses elementos, liga eventos e effects e remove as chaves.
- Os estilos de `css`, `styled` e da prop `css` são coletados no servidor; o cliente os detecta e não os injeta de novo.
- `renderToStream()` devolve um stream de bytes (estilos primeiro) que você passa para `new Response()`. Assim como o `renderToString`, não espera dados.
- No servidor, `innerHTML` não é impresso (lá não há sanitizador de DOM); o cliente o define, sanitizado, durante a hidratação. O conteúdo de `Portal` só existe no cliente.

Veja [`examples/ssr`](examples/ssr) para um servidor de desenvolvimento completo.

## Segurança

- Texto é sempre inserido como texto (`createTextNode`), nunca interpretado como HTML.
- `innerHTML` passa por um sanitizador com lista de permissões (com Trusted Types quando disponível).
- URLs em `href`, `src`, `action`, `formaction`, `srcset`... são verificadas depois da mesma normalização que os navegadores aplicam, então `java\tscript:` e truques parecidos são bloqueados. `data:` só é aceito para imagens raster em `src`.
- Nomes de atributo que poderiam escapar da tag (espaços, aspas, `=`...) são rejeitados, no cliente e no SSR.
- Handlers em string (`onclick="..."`) são rejeitados; handlers são funções guardadas fora do DOM.
- Sem `eval`, `new Function` ou scripts inline. O CSS do servidor não consegue fechar a tag `<style>`.

Detalhes em [SECURITY.md](SECURITY.md).

## Sem plugin de bundler

O `@velozjs/dom` também exporta `createElement(tag, props, ...children)`, então funciona com qualquer configuração de JSX (`jsxFactory`) ou sem JSX.

## Desenvolvimento

```bash
pnpm install
pnpm test        # vitest (core, dom, css, ssr, vite-plugin)
pnpm typecheck
pnpm build
```

Veja [CONTRIBUTING.md](CONTRIBUTING.md). As notas de versão estão em [CHANGELOG.md](CHANGELOG.md).

## Licença

[MIT](LICENSE) © Julio Carneiro
