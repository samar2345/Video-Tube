// Response to anyone will be sent through this class only
class ApiResponse{
    constructor(statusCode,data,message="Success")
    {
        this.statusCode=statusCode,
        this.data=data,
        this.message=message,
        this.success=statusCode <400
    }
}