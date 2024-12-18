import { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string | null;
  date_start: number;
  date_end: number;
}

interface APIResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

const App = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);
  const [rowsInput, setRowsInput] = useState<string>('');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const op = useRef<OverlayPanel>(null);

  const fetchArtworks = async (page: number, rows: number) => {
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`
      );
      const data: APIResponse = await response.json();
      setArtworks(data.data);
      setTotalRecords(data.pagination.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    }
  };

  useEffect(() => {
    fetchArtworks(1, rowsPerPage);
  }, [rowsPerPage]);

  const onPage = (event: { first: number; rows: number; page?: number }) => {
    const page = event.first / event.rows + 1;
    setRowsPerPage(event.rows);
    fetchArtworks(page, event.rows);
  };

  const handleRowsSubmit = async () => {
    const numRows = parseInt(rowsInput);

    if (!isNaN(numRows) && numRows > 0) {
      let allRows: Artwork[] = [];
      let currentPage = 1;

      try {
        while (allRows.length < numRows) {
          const response = await fetch(
            `https://api.artic.edu/api/v1/artworks?page=${currentPage}`
          );
          const data: APIResponse = await response.json();
          allRows = [...allRows, ...data.data];
          currentPage++;

          if (data.pagination.offset + data.pagination.limit >= data.pagination.total) {
            break;
          }
        }

        const selectedRows = allRows.slice(0, numRows);
        setSelectedRows(selectedRows);
        setArtworks(allRows.slice(0, 12));
        setTotalRecords(allRows.length);
        setRowsInput('');
        op.current?.hide();
      } catch (error) {
        console.error('Error fetching rows across pages:', error);
      }
    }
  };

  const TitleHeader = () => (
    <div className="flex align-items-center">
      <div className='m-2'>
        <Button
          icon="pi pi-chevron-down"
          onClick={(e) => op.current?.toggle(e)}
          className="p-button-text p-button-sm ml-4"
        />
      </div>
      <span style={{ marginLeft: '10px' }}>Title</span>
    </div>
  );

  return (
    <div className="card">
      <OverlayPanel ref={op} className="p-3">
        <div className="flex flex-column gap-2">
          <InputText
            value={rowsInput}
            onChange={(e) => setRowsInput(e.target.value)}
            placeholder="Select rows..."
            className="w-full"
          />
          <Button
            label="Submit"
            onClick={handleRowsSubmit}
            disabled={
              !rowsInput || isNaN(parseInt(rowsInput)) || parseInt(rowsInput) > totalRecords
            }
            className="w-full"
          />
        </div>
      </OverlayPanel>

      <DataTable
        value={artworks}
        lazy
        paginator
        rows={rowsPerPage}
        totalRecords={totalRecords}
        first={(currentPage - 1) * rowsPerPage}
        onPage={onPage}
        selection={selectedRows}
        onSelectionChange={(e) => setSelectedRows(e.value)}
        selectionMode="multiple"
        dataKey="id"
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
        <Column field="title" header={TitleHeader} />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
    </div>
  );
};

export default App;
