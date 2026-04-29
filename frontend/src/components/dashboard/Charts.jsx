import Card from "../common/Card";

export default function Charts() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <h3 className="font-semibold mb-2">Thống kê 7 ngày</h3>
        <div className="h-40 flex items-center justify-center text-gray-400">
          Chart line
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-2">TOPIK</h3>
        <div className="h-40 flex items-center justify-center text-gray-400">
          Pie chart
        </div>
      </Card>
    </div>
  );
}
