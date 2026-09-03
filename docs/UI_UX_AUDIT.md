# Auditoria de UI/UX

- Data: 02/09/2026
- Escopo: `app/globals.css`, `app/components/ui/`, formulários, shell de navegação, estados, autenticação, dashboard, listagens, tabelas, filtros, diálogos e fluxos de criação/edição.
- Método: inspeção estrutural de rotas e componentes, busca de padrões visuais/acessíveis e revisão dos primitives compartilhados.

## Problemas encontrados e correções

### [Média] Campos equivalentes tinham foco e acabamento diferentes

- Local: `app/components/ui/textarea.tsx`
- Categoria: consistência visual e acessibilidade
- Problema: textarea divergia do input em raio, fundo, sombra e foco.
- Impacto: formulários irregulares e foco menos evidente.
- Correção: alinhamento ao padrão do input, com `rounded-lg`, fundo semântico, sombra e foco de 3px.
- Status: corrigido.

### [Média] Estado de carregamento não estava localizado

- Local: `app/components/ui/spinner.tsx`
- Categoria: acessibilidade e conteúdo
- Problema: status usava “Loading...” e não declarava atualização ao leitor de tela.
- Impacto: experiência inconsistente para usuários de língua portuguesa.
- Correção: “Carregando”, `aria-live="polite"` e SVG decorativo oculto.
- Status: corrigido.

### [Baixa] Cores diretas aparecem em várias telas

- Local: dashboards, badges e landing page
- Categoria: design system
- Problema: `blue`, `emerald`, `rose` e `amber` são usados localmente.
- Impacto: maior custo de manutenção e risco entre temas.
- Correção: não aplicado em massa para evitar alterar significado visual de dados; migração gradual documentada.
- Status: pendente.

### [Baixa] Shell de página e cabeçalho são repetidos

- Local: páginas em `app/(pages)/(workspace)/[workspaceId]/`
- Categoria: arquitetura visual
- Problema: branding e estruturas são repetidos entre rotas.
- Impacto: futuras alterações podem divergir.
- Correção: criado `app/components/page-header.tsx` e aplicado na tela de Bancos e Contas, unificando título, descrição, ícone e CTA em desktop/mobile.
- Status: parcialmente corrigido; demais rotas podem migrar incrementalmente.

## Recomendações futuras

- Criar `PageHeader` compartilhado após mapear todas as variações.
- Migrar cores de status para tokens semânticos dedicados, validando contraste.
- Executar testes automatizados de acessibilidade com axe em rotas autenticadas.
- Revisar visualmente cada breakpoint no preview de produção.

### [Baixa] Labels de acessibilidade inconsistentes

- Local: `app/components/ui/breadcrumb.tsx`, `app/components/ui/sidebar.tsx`, `app/components/workspace-form.tsx`
- Categoria: acessibilidade e localização
- Problema: labels em inglês e um label com erro de digitação.
- Impacto: anúncios pouco naturais ou incorretos para leitores de tela.
- Correção: labels traduzidos para português e texto de elipse localizado.
- Status: corrigido.

## Pontos para decisão de produto

- Definir se o amarelo permanece como única cor primária em todas as ações.
- Definir se badges de receitas/despesas devem incluir texto semântico além da cor.
