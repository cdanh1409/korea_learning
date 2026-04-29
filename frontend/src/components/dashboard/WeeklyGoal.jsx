import Card from "../common/Card";

export default function WeeklyGoal() {
  return (
    <Card>
      <h3 className="font-semibold mb-3">Mục tiêu tuần</h3>

      <div className="space-y-3">
        <div>
          <p className="text-sm">Học từ: 90/100</p>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div className="bg-green-500 h-2 rounded w-[90%]"></div>
          </div>
        </div>

        <div>
          <p className="text-sm">Ôn tập: 80/100</p>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div className="bg-blue-500 h-2 rounded w-[80%]"></div>
          </div>
        </div>

        <div>
          <p className="text-sm">Bài tập: 5/10</p>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div className="bg-purple-500 h-2 rounded w-[50%]"></div>
          </div>
        </div>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
        <div className="bg-green-500 h-2 rounded w-[90%] transition-all duration-700"></div>
      </div>
    </Card>
  );
}
