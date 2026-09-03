# Diretrizes de UI/UX — MeControla.AI

## Objetivo e escopo

Este guia define os padrões visuais, de interação e acessibilidade para telas e componentes em `app/`. Consulte-o junto de `AGENTS.md`, `app/globals.css` e os componentes base antes de qualquer mudança de UI/UX.

## Princípios

- Clareza antes de ornamentação; cada tela deve ter uma ação principal evidente.
- Reutilizar `app/components/ui/` e os tokens semânticos de `app/globals.css`.
- Valores positivos e negativos devem ser distinguíveis sem depender somente de cor.
- Dar feedback imediato e preservar a reversibilidade sempre que possível.
- Mobile é uma experiência prioritária.

## Layout, responsividade e espaçamento

Use `w-full`, `min-w-0` em áreas truncáveis e grids responsivos. Listagens devem oferecer uma alternativa para telas estreitas (`data-display/mobile-list.tsx`). Tabelas usam wrapper com rolagem explícita quando necessário. Use `gap-2` em controles próximos, `gap-3` em grupos, `gap-4` entre blocos e `space-y-6` entre seções. Evite valores arbitrários repetidos.

## Tipografia e hierarquia

O texto usa Geist via tokens globais. Títulos de página: `text-2xl font-semibold`; títulos de seção: `text-base font-semibold`; labels: `text-sm font-medium`; apoio e metadados: `text-xs`/`text-sm text-muted-foreground`. Valores financeiros podem usar `font-semibold`, sem competir com o título.

## Cores e semântica

Prefira `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-success`, `text-info`, `text-warning` e `text-destructive`. Os tokens representam receita/sucesso, informação, atenção e despesa. Sempre inclua texto, ícone ou label complementar; verifique contraste nos dois temas.

## Botões e ações

Use `Button` para todas as ações. Uma tela deve ter uma ação primária; secundárias usam `outline`/`secondary`, destrutivas usam `destructive` e discretas usam `ghost`. Botões somente com ícone precisam de `aria-label`; ícones decorativos precisam de `aria-hidden="true"`. Estados de envio devem desabilitar o botão e informar carregamento.

## Formulários e validação

Use `react-hook-form`, `zodResolver` e `form.tsx`. Todo campo precisa de label associado, instrução quando necessário e erro ligado por `aria-describedby`. Use `Input`, `Textarea` e `Select` compartilhados; não use placeholder como substituto de label.

## Tabelas, filtros e paginação

Use `table.tsx`, `pagination.tsx` e `column-header.tsx`. Cabeçalhos devem comunicar ordenação; filtros devem ser identificáveis e removíveis; paginação deve funcionar por teclado. Em mobile, priorize `mobile-list.tsx` e preserve as ações essenciais.

## Diálogos, popovers e confirmações

Use `Dialog`, `Sheet`, `Popover` e `confirmation-dialog.tsx`. Títulos e descrições devem explicar a ação. Exclusões e alterações irreversíveis exigem confirmação clara. O foco deve permanecer no modal e retornar ao acionador.

## Estados

Use `LoadingState`, `EmptyState` e `ErrorState` antes de criar variações locais. Skeleton deve manter a geometria do conteúdo. Loading usa `role="status"` e texto em português; erros explicam o problema e oferecem retry quando possível; estados vazios orientam o próximo passo; Sonner complementa, mas não substitui, erros inline.

## Acessibilidade, ícones e temas

Garanta foco visível, ordem de tabulação lógica, alvos confortáveis e contraste suficiente. Não dependa somente de cor. Imagens informativas têm `alt` descritivo; decorativas usam `alt=""`. Use Lucide (`size-4` em controles, `size-5` em navegação). Regiões de navegação devem ter labels em português e estados dinâmicos devem usar `role="status"`/`aria-live` quando apropriado. O tema é controlado por `theme-provider.tsx`; prefira tokens a branco/preto fixos.

## Navegação e componentes existentes

Use o shell existente (`app-sidebar.tsx`, `mobile-nav.tsx`, breadcrumbs e navegação contextual). O item ativo deve ser perceptível além da cor. Padrões disponíveis: `PageHeader`, `Button`, `Card`, `Dialog`, `Form`, `Input`, `Select`, `Textarea`, `Badge`, `Table`, `LoadingState`, `EmptyState`, `ErrorState`, `ConfirmationDialog` e `Sonner`.

Evite cores diretas repetidas, valores arbitrários recorrentes, `alert()`/`confirm()`, texto em inglês, botões de ícone sem label, campos sem label e componentes base duplicados.

## Checklist para novas telas

- [ ] Hierarquia, ação principal e navegação contextual definidas.
- [ ] Mobile, tablet e desktop testados sem overflow indevido.
- [ ] Loading, vazio, erro, sucesso e disabled previstos.
- [ ] Labels, validação e mensagens acessíveis.
- [ ] Ações destrutivas confirmadas.
- [ ] Cores e temas claro/escuro revisados.
- [ ] Teclado, foco, leitores de tela e contraste verificados.
- [ ] Componentes compartilhados reutilizados.

## Exemplos e instrução para agentes

Consulte `app/components/forms/*-form.tsx`, `app/components/ui/confirmation-dialog.tsx`, `app/components/states/*` e `app/(pages)/(workspace)/[workspaceId]/dashboard/debits/columns.tsx`. Agentes devem ler este arquivo antes de implementar mudanças visuais e atualizar `docs/UI_UX_AUDIT.md` quando alterarem padrões ou consistência.
