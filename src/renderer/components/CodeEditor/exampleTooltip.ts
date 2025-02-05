import { Tooltip, showTooltip, EditorView } from '@codemirror/view';
import { StateField, EditorState } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

export type TooltipDirectionary = Record<
  string,
  { syntax: string; description: string }
>;

function getCursorTooltips(
  state: EditorState,
  dict: TooltipDirectionary
): readonly Tooltip[] {
  const tree = syntaxTree(state);
  const pos = state.selection.main.head;
  const node = tree.resolveInner(state.selection.main.head, -1);

  console.log(node);

  const parent = node.parent;
  if (!parent) return [];
  if (parent.type.name !== 'Parens') return [];

  if (!parent.prevSibling) return [];
  if (parent.prevSibling.type.name !== 'Keyword') return [];

  const keywordString = state.doc
    .slice(parent.prevSibling.from, parent.prevSibling.to)
    .toString()
    .toLowerCase();

  const dictItem = dict[keywordString];

  if (dictItem) {
    return [
      {
        pos: pos,
        above: true,
        arrow: true,
        create: () => {
          const dom = document.createElement('div');
          dom.className = 'cm-tooltip-cursor';
          dom.innerHTML = `
            <div style="max-width:700px;">
              <p><i>${dictItem.syntax}</i></p>
              <div class="code-tooltip">${dictItem.description}</div>
            </div>
            `;
          return { dom };
        },
      },
    ];
  }

  return [];
}

const cursorTooltipField = (dict: TooltipDirectionary) => {
  return StateField.define<readonly Tooltip[]>({
    create(state) {
      return getCursorTooltips(state, dict);
    },

    update(tooltips, tr) {
      if (!tr.docChanged && !tr.selection) return tooltips;
      return getCursorTooltips(tr.state, dict);
    },

    provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
  });
};

const cursorTooltipBaseTheme = EditorView.baseTheme({
  '.cm-tooltip.cm-tooltip-cursor': {
    backgroundColor: '#66b',
    color: 'white',
    border: 'none',
    padding: '2px 7px',
    borderRadius: '4px',
    '& .cm-tooltip-arrow:before': {
      borderTopColor: '#66b',
    },
    '& .cm-tooltip-arrow:after': {
      borderTopColor: 'transparent',
    },
  },
});

export function cursorTooltip(dict: TooltipDirectionary) {
  return [cursorTooltipField(dict), cursorTooltipBaseTheme];
}
