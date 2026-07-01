import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ITableProps = ComponentPropsWithoutRef<"table">;

export const Table = ({ className, ...props }: ITableProps) => (
  <div className="ui-table-container">
    <table className={cn("ui-table", className)} {...props} />
  </div>
);

export type ITableHeaderProps = ComponentPropsWithoutRef<"thead">;

export const TableHeader = ({ className, ...props }: ITableHeaderProps) => (
  <thead className={cn("ui-table-header", className)} {...props} />
);

export type ITableBodyProps = ComponentPropsWithoutRef<"tbody">;

export const TableBody = ({ className, ...props }: ITableBodyProps) => (
  <tbody className={cn("ui-table-body", className)} {...props} />
);

export type ITableRowProps = ComponentPropsWithoutRef<"tr">;

export const TableRow = ({ className, ...props }: ITableRowProps) => (
  <tr className={cn("ui-table-row", className)} {...props} />
);

export type ITableHeadProps = ComponentPropsWithoutRef<"th">;

export const TableHead = ({ className, ...props }: ITableHeadProps) => (
  <th className={cn("ui-table-head", className)} {...props} />
);

export type ITableCellProps = ComponentPropsWithoutRef<"td">;

export const TableCell = ({ className, ...props }: ITableCellProps) => (
  <td className={cn("ui-table-cell", className)} {...props} />
);
