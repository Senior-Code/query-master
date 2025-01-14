import { useState, useCallback } from 'react';
import {
  TableEditableEditorProps,
  TableEditableContentProps,
} from './TableEditableCell';
import createTableCellType from './createTableCellType';
import TableCellContent from 'renderer/components/ResizableTable/TableCellContent';
import TableCellInput from 'renderer/components/ResizableTable/TableCellInput';

function TableCellStringEditor({
  value,
  onExit,
  readOnly,
}: TableEditableEditorProps) {
  const [editValue, setEditValue] = useState(value as string);

  const onLostFocus = useCallback(
    (v: string | null | undefined) => {
      if (onExit) {
        onExit(false, v);
      }
    },
    [onExit]
  );

  return (
    <TableCellInput
      fullEditor
      readOnly={readOnly}
      onChange={setEditValue}
      onLostFocus={onLostFocus}
      value={editValue}
    />
  );
}

function TableCellStringContent({ value }: TableEditableContentProps) {
  return <TableCellContent value={value} />;
}

const TableCellString = createTableCellType({
  diff: (prev: string, current: string) => prev !== current,
  content: TableCellStringContent,
  editor: TableCellStringEditor,
  onCopy: (value: string) => {
    return value;
  },
  onPaste: (value: string) => {
    return { accept: true, value };
  },
});

export default TableCellString;
